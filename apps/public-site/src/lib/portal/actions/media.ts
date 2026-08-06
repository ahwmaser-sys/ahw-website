'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES } from '../roles';
import { prisma } from '../db';
import { deleteFile } from '../storage';
import { runMediaPipeline } from '../media/pipeline';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

function parseKeywords(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

async function resolveTagIds(tx: typeof prisma, names: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!slug) continue;
    const tag = await tx.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    ids.push(tag.id);
  }
  return ids;
}

const uploadSchema = z.object({
  kind: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT', 'ICON', 'LOGO']),
  photographer: z.string().trim().optional(),
  copyright: z.string().trim().optional(),
  altText: z.string().trim().optional(),
  projectId: z.string().optional(),
  service: z.enum(['ARCHITECTURE', 'INTERIOR_DESIGN', 'DESIGN_BUILD', 'FIT_OUT']).optional(),
});

export async function uploadMediaAsset(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = uploadSchema.safeParse({
    kind: formData.get('kind'),
    photographer: formData.get('photographer') || undefined,
    copyright: formData.get('copyright') || undefined,
    altText: formData.get('altText') || undefined,
    projectId: formData.get('projectId') || undefined,
    service: formData.get('service') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose a file to upload.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const keywords = parseKeywords(formData.get('keywords'));
  const tagNames = parseKeywords(formData.get('tags'));

  let pipelineResult;
  try {
    pipelineResult = await runMediaPipeline({
      buffer,
      fileName: file.name,
      declaredType: file.type,
      kind: parsed.data.kind,
      generateVariants: parsed.data.kind === 'IMAGE',
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Upload failed.' };
  }

  const tagIds = await resolveTagIds(prisma, tagNames);

  const asset = await prisma.mediaAsset.create({
    data: {
      kind: parsed.data.kind,
      storageKey: pipelineResult.storageKey,
      fileName: file.name,
      fileType: pipelineResult.fileType,
      fileSize: pipelineResult.fileSize,
      width: pipelineResult.width,
      height: pipelineResult.height,
      orientation: pipelineResult.orientation,
      dominantColors: pipelineResult.dominantColors,
      durationSeconds: pipelineResult.durationSeconds,
      keywords,
      photographer: parsed.data.photographer ?? null,
      copyright: parsed.data.copyright ?? null,
      altText: parsed.data.altText ?? null,
      projectId: parsed.data.projectId ?? null,
      service: parsed.data.service ?? null,
      uploadedById: principal.userId,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
      variants: {
        create: pipelineResult.variants.map((v) => ({
          purpose: v.purpose,
          storageKey: v.storageKey,
          width: v.width,
          height: v.height,
        })),
      },
    },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.media_asset_uploaded',
    entityType: 'MediaAsset',
    entityId: asset.id,
    metadata: { kind: parsed.data.kind, fileName: file.name },
  });

  revalidatePath('/admin/media');
  return { success: `${file.name} uploaded and ${pipelineResult.variants.length} variant(s) generated.` };
}

const updateMetadataSchema = z.object({
  assetId: z.string().min(1),
  photographer: z.string().trim().optional(),
  copyright: z.string().trim().optional(),
  altText: z.string().trim().optional(),
  keywords: z.string().optional(),
  tags: z.string().optional(),
});

export async function updateMediaAssetMetadata(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = updateMetadataSchema.safeParse({
    assetId: formData.get('assetId'),
    photographer: formData.get('photographer') || undefined,
    copyright: formData.get('copyright') || undefined,
    altText: formData.get('altText') || undefined,
    keywords: formData.get('keywords') || undefined,
    tags: formData.get('tags') || undefined,
  });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const keywords = parseKeywords(formData.get('keywords'));
  const tagNames = parseKeywords(formData.get('tags'));
  const tagIds = await resolveTagIds(prisma, tagNames);

  await prisma.$transaction([
    prisma.mediaAssetTag.deleteMany({ where: { mediaAssetId: parsed.data.assetId } }),
    prisma.mediaAsset.update({
      where: { id: parsed.data.assetId },
      data: {
        photographer: parsed.data.photographer ?? null,
        copyright: parsed.data.copyright ?? null,
        altText: parsed.data.altText ?? null,
        keywords,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
    }),
  ]);

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.media_asset_updated',
    entityType: 'MediaAsset',
    entityId: parsed.data.assetId,
  });

  revalidatePath(`/admin/media/${parsed.data.assetId}`);
  return { success: 'Metadata saved.' };
}

export async function deleteMediaAsset(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const assetId = formData.get('assetId');
  if (typeof assetId !== 'string' || !assetId) {
    return { error: 'Invalid request.' };
  }

  const usageCount = await prisma.mediaAssetUsage.count({ where: { assetId } });
  if (usageCount > 0) {
    return { error: `This asset is used in ${usageCount} place(s) — remove those references before deleting.` };
  }

  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId }, include: { variants: true } });
  if (!asset) {
    return { error: 'Not found.' };
  }

  await deleteFile(asset.storageKey);
  await Promise.all(asset.variants.map((v) => deleteFile(v.storageKey)));
  await prisma.mediaAsset.delete({ where: { id: assetId } });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.media_asset_deleted',
    entityType: 'MediaAsset',
    entityId: assetId,
  });

  revalidatePath('/admin/media');
  return { success: 'Asset deleted.' };
}

const archiveSchema = z.object({ assetId: z.string().min(1) });

// Soft delete — the reversible middle ground before committing to
// deleteMediaAsset's permanent removal. Doesn't touch the file or any
// reference to it (an archived asset already embedded in published
// content keeps rendering exactly as before); it only hides the asset
// from the default Media Library view.
export async function archiveMediaAsset(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = archiveSchema.safeParse({ assetId: formData.get('assetId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.mediaAsset.update({ where: { id: parsed.data.assetId }, data: { archivedAt: new Date() } });
  await recordActivity({ actorId: principal.userId, action: 'admin.media_asset_archived', entityType: 'MediaAsset', entityId: parsed.data.assetId });
  revalidatePath('/admin/media');
  return { success: 'Asset archived.' };
}

export async function restoreMediaAsset(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = archiveSchema.safeParse({ assetId: formData.get('assetId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.mediaAsset.update({ where: { id: parsed.data.assetId }, data: { archivedAt: null } });
  await recordActivity({ actorId: principal.userId, action: 'admin.media_asset_restored', entityType: 'MediaAsset', entityId: parsed.data.assetId });
  revalidatePath('/admin/media');
  return { success: 'Asset restored.' };
}

const createCollectionSchema = z.object({ name: z.string().trim().min(1, 'Name is required.') });

export async function createMediaCollection(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = createCollectionSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const baseSlug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.mediaCollection.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  await prisma.mediaCollection.create({ data: { name: parsed.data.name, slug } });

  revalidatePath('/admin/media');
  return { success: 'Collection created.' };
}

const addToCollectionSchema = z.object({ assetId: z.string().min(1), collectionId: z.string().min(1) });

export async function addAssetToCollection(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = addToCollectionSchema.safeParse({
    assetId: formData.get('assetId'),
    collectionId: formData.get('collectionId'),
  });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  await prisma.mediaCollectionAsset.upsert({
    where: { collectionId_assetId: { collectionId: parsed.data.collectionId, assetId: parsed.data.assetId } },
    update: {},
    create: { collectionId: parsed.data.collectionId, assetId: parsed.data.assetId },
  });

  revalidatePath(`/admin/media/${parsed.data.assetId}`);
  return { success: 'Added to collection.' };
}

const createCategorySchema = z.object({ name: z.string().trim().min(1, 'Name is required.') });

export async function createCategory(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = createCategorySchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const baseSlug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.category.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  await prisma.category.create({ data: { name: parsed.data.name, slug } });

  revalidatePath('/admin/media');
  revalidatePath('/admin/news');
  return { success: 'Category created.' };
}

const deleteTaxonomySchema = z.object({ id: z.string().min(1) });

// Hard delete, safely — a Category/Tag has no data of its own beyond its
// name; deleting one only removes the join-table rows linking it to
// articles/media (onDelete: Cascade on NewsPostCategory/MediaAssetTag
// etc.), never the articles or media themselves. This is the one
// lifecycle case in this app where a genuine hard delete is completely
// safe by construction, not just permitted with a usage check.
export async function deleteCategory(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = deleteTaxonomySchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.category.delete({ where: { id: parsed.data.id } });
  await recordActivity({ actorId: principal.userId, action: 'admin.category_deleted', entityType: 'Category', entityId: parsed.data.id });
  revalidatePath('/admin/media');
  revalidatePath('/admin/news');
  return { success: 'Category deleted.' };
}

export async function deleteTag(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = deleteTaxonomySchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.tag.delete({ where: { id: parsed.data.id } });
  await recordActivity({ actorId: principal.userId, action: 'admin.tag_deleted', entityType: 'Tag', entityId: parsed.data.id });
  revalidatePath('/admin/media');
  revalidatePath('/admin/news');
  return { success: 'Tag deleted.' };
}
