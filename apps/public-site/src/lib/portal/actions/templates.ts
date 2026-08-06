'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES, SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { readFileByKey, saveFile } from '../storage';
import { getActiveBrandKit } from '../brand-kit';
import { renderTemplateToPng } from '../../content-studio/template-engine/render';
import type { TemplateDefinition, TemplateVariables } from '../../content-studio/template-engine/types';
import type { BrandColors, BrandTypography, BrandLogos, BrandWatermark } from '../brand-kit';
import { getOutputTarget } from '../media/output-targets';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

function toDataUri(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

const generateSchema = z.object({
  templateId: z.string().min(1),
  sourceAssetId: z.string().min(1),
  newsPostId: z.string().optional(),
  campaignId: z.string().optional(),
  targets: z.array(z.string()).min(1, 'Select at least one output.'),
});

// The user-facing flow this implements: choose template → choose image →
// generate. Everything else — resolving the Brand Kit, loading fonts,
// rendering each requested platform size — happens here, invisibly.
export async function generateGraphics(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const targets = formData.getAll('targets').map(String);
  const parsed = generateSchema.safeParse({
    templateId: formData.get('templateId'),
    sourceAssetId: formData.get('sourceAssetId'),
    newsPostId: formData.get('newsPostId') || undefined,
    campaignId: formData.get('campaignId') || undefined,
    targets,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const [template, sourceAsset, kit] = await Promise.all([
    prisma.socialTemplate.findUnique({ where: { id: parsed.data.templateId } }),
    prisma.mediaAsset.findUnique({ where: { id: parsed.data.sourceAssetId } }),
    getActiveBrandKit(),
  ]);
  if (!template) return { error: 'Template not found.' };
  if (!sourceAsset) return { error: 'Source image not found.' };

  const definition = template.definition as unknown as TemplateDefinition;
  const variables: TemplateVariables = Object.fromEntries(
    definition.variables.map((key) => {
      const raw = formData.get(`var_${key}`);
      return [key, typeof raw === 'string' ? raw : ''];
    })
  );

  const colors = kit.colors as unknown as BrandColors;
  const typography = kit.typography as unknown as BrandTypography;
  const logos = kit.logos as unknown as BrandLogos;
  const watermark = kit.watermark as unknown as BrandWatermark | null;

  const sourceBuffer = await readFileByKey(sourceAsset.storageKey);
  const sourceImageDataUri = toDataUri(sourceBuffer, sourceAsset.fileType);

  const logoDataUris: Partial<Record<'light' | 'dark' | 'icon', string>> = {};
  for (const slot of ['light', 'dark', 'icon'] as const) {
    const assetId = logos[slot];
    if (!assetId) continue;
    const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
    if (!asset) continue;
    const buffer = await readFileByKey(asset.storageKey);
    logoDataUris[slot] = toDataUri(buffer, asset.fileType);
  }

  let watermarkDataUri: string | null = null;
  if (watermark?.assetId) {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: watermark.assetId } });
    if (asset) {
      const buffer = await readFileByKey(asset.storageKey);
      watermarkDataUri = toDataUri(buffer, asset.fileType);
    }
  }

  const graphic = await prisma.generatedGraphic.create({
    data: {
      templateId: template.id,
      sourceAssetId: sourceAsset.id,
      newsPostId: parsed.data.newsPostId ?? null,
      campaignId: parsed.data.campaignId ?? null,
      variables,
      createdById: principal.userId,
    },
  });

  const outputs: { purpose: string; storageKey: string; width: number; height: number }[] = [];
  for (const targetKey of parsed.data.targets) {
    const target = getOutputTarget(targetKey);
    if (!target) continue;

    let png: Buffer;
    try {
      png = await renderTemplateToPng(
        definition,
        {
          colors,
          typography,
          logos,
          watermark,
          websiteUrl: kit.websiteUrl,
          variables,
          sourceImageDataUri,
          logoDataUris,
          watermarkDataUri,
        },
        target.width,
        target.height
      );
    } catch (error) {
      await prisma.generatedGraphic.delete({ where: { id: graphic.id } });
      return { error: `Rendering failed for ${target.label}: ${error instanceof Error ? error.message : 'unknown error'}` };
    }

    const storageKey = await saveFile(`generated-graphics/${graphic.id}/${target.key}.png`, png);
    outputs.push({ purpose: target.key, storageKey, width: target.width, height: target.height });
  }

  await prisma.generatedGraphicOutput.createMany({
    data: outputs.map((o) => ({ ...o, generatedGraphicId: graphic.id })),
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.graphics_generated',
    entityType: 'GeneratedGraphic',
    entityId: graphic.id,
    metadata: { templateKey: template.key, outputCount: outputs.length },
  });

  if (parsed.data.newsPostId) revalidatePath(`/admin/news/${parsed.data.newsPostId}`);
  revalidatePath('/admin/templates');
  return { success: `Generated ${outputs.length} output(s): ${outputs.map((o) => o.purpose).join(', ')}.` };
}

const createTemplateSchema = z.object({
  key: z.string().trim().min(1, 'Key is required.'),
  name: z.string().trim().min(1, 'Name is required.'),
  category: z.string().trim().min(1, 'Category is required.'),
  description: z.string().trim().optional(),
  definitionJson: z.string().min(1, 'Definition is required.'),
});

// Admin-authored templates — the "plugin friendly" half of "no hardcoded
// templates": a new template is a JSON definition submitted here, not a
// deploy. The ~10 official AHW templates ship the same way, via a seed
// script, not as special-cased code paths.
export async function createTemplate(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = createTemplateSchema.safeParse({
    key: formData.get('key'),
    name: formData.get('name'),
    category: formData.get('category'),
    description: formData.get('description') || undefined,
    definitionJson: formData.get('definitionJson'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  let definition: unknown;
  try {
    definition = JSON.parse(parsed.data.definitionJson);
  } catch {
    return { error: 'Definition is not valid JSON.' };
  }

  const existing = await prisma.socialTemplate.findUnique({ where: { key: parsed.data.key } });
  if (existing) {
    return { error: 'A template with this key already exists.' };
  }

  await prisma.socialTemplate.create({
    data: {
      key: parsed.data.key,
      name: parsed.data.name,
      category: parsed.data.category,
      description: parsed.data.description ?? null,
      definition: definition as never,
      createdById: principal.userId,
    },
  });

  revalidatePath('/admin/templates');
  return { success: 'Template created.' };
}

const deactivateSchema = z.object({ templateId: z.string().min(1) });

export async function deactivateTemplate(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = deactivateSchema.safeParse({ templateId: formData.get('templateId') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  await prisma.socialTemplate.update({ where: { id: parsed.data.templateId }, data: { isActive: false } });
  revalidatePath('/admin/templates');
  return { success: 'Template deactivated.' };
}

export async function reactivateTemplate(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = deactivateSchema.safeParse({ templateId: formData.get('templateId') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  await prisma.socialTemplate.update({ where: { id: parsed.data.templateId }, data: { isActive: true } });
  revalidatePath('/admin/templates');
  return { success: 'Template reactivated.' };
}

const deleteTemplateSchema = z.object({ templateId: z.string().min(1) });

// Hard delete — safe only when the template is genuinely unused (no
// GeneratedGraphic ever referenced it) and isn't one of the 10 official
// templates (those ship with the app; deleting one would be a surprise
// after every future deploy re-seeds it — deactivate instead).
export async function deleteTemplate(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = deleteTemplateSchema.safeParse({ templateId: formData.get('templateId') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const template = await prisma.socialTemplate.findUnique({ where: { id: parsed.data.templateId }, include: { _count: { select: { generatedGraphics: true } } } });
  if (!template) {
    return { error: 'Not found.' };
  }
  if (template.isOfficial) {
    return { error: 'Official templates can be deactivated but not deleted — they ship with the app and would be re-seeded on next deploy anyway.' };
  }
  if (template._count.generatedGraphics > 0) {
    return { error: `Used by ${template._count.generatedGraphics} generated graphic(s) — deactivate instead of deleting.` };
  }

  await prisma.socialTemplate.delete({ where: { id: parsed.data.templateId } });
  await recordActivity({ actorId: principal.userId, action: 'admin.template_deleted', entityType: 'SocialTemplate', entityId: parsed.data.templateId });
  revalidatePath('/admin/templates');
  return { success: 'Template deleted.' };
}
