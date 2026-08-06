'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES, SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import { isLandingPageBlockArray, collectAssetIds } from '../../content-studio/landing-page-blocks';
import type { ActionState } from '../../../components/portal/ActionForm';

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const createSchema = z.object({ title: z.string().trim().min(1, 'Title is required.') });

export async function createLandingPage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = createSchema.safeParse({ title: formData.get('title') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const baseSlug = slugify(parsed.data.title);
  if (!baseSlug) {
    return { error: 'Title must contain at least one letter or number.' };
  }
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.landingPage.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const page = await prisma.landingPage.create({
    data: {
      title: parsed.data.title,
      slug,
      blocks: [{ type: 'hero', headline: parsed.data.title }],
      createdById: principal.userId,
    },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.landing_page_created', entityType: 'LandingPage', entityId: page.id });
  revalidatePath('/admin/landing-pages');
  redirect(`/admin/landing-pages/${page.id}`);
}

const updateSchema = z.object({
  pageId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required.'),
  blocksJson: z.string().min(1, 'Blocks JSON is required.'),
  campaignId: z.string().optional(),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  ogImageId: z.string().optional(),
});

export async function updateLandingPage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = updateSchema.safeParse({
    pageId: formData.get('pageId'),
    title: formData.get('title'),
    blocksJson: formData.get('blocksJson'),
    campaignId: formData.get('campaignId') || undefined,
    metaTitle: formData.get('metaTitle') || undefined,
    metaDescription: formData.get('metaDescription') || undefined,
    ogImageId: formData.get('ogImageId') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  let blocks: unknown;
  try {
    blocks = JSON.parse(parsed.data.blocksJson);
  } catch {
    return { error: 'Blocks is not valid JSON.' };
  }
  if (!isLandingPageBlockArray(blocks)) {
    return { error: 'Blocks must be an array of objects, each with a "type" field.' };
  }

  // Every referenced asset id must actually exist — checked at save
  // time since blocks store ids as plain strings, not a DB-enforced FK
  // (see schema.prisma's LandingPage comment).
  const assetIds = collectAssetIds(blocks);
  if (assetIds.length > 0) {
    const found = await prisma.mediaAsset.count({ where: { id: { in: assetIds } } });
    if (found !== new Set(assetIds).size) {
      return { error: 'One or more images referenced in the blocks could not be found.' };
    }
  }

  await prisma.landingPage.update({
    where: { id: parsed.data.pageId },
    data: {
      title: parsed.data.title,
      blocks: blocks as never,
      campaignId: parsed.data.campaignId ?? null,
      metaTitle: parsed.data.metaTitle ?? null,
      metaDescription: parsed.data.metaDescription ?? null,
      ogImageId: parsed.data.ogImageId ?? null,
    },
  });

  for (const assetId of new Set(assetIds)) {
    await prisma.mediaAssetUsage.upsert({
      where: { assetId_entityType_entityId: { assetId, entityType: 'LandingPage', entityId: parsed.data.pageId } },
      update: {},
      create: { assetId, entityType: 'LandingPage', entityId: parsed.data.pageId },
    });
  }

  await recordActivity({ actorId: principal.userId, action: 'admin.landing_page_updated', entityType: 'LandingPage', entityId: parsed.data.pageId });
  revalidatePath(`/admin/landing-pages/${parsed.data.pageId}`);
  revalidatePath(`/lp/${parsed.data.pageId}`);
  return { success: 'Saved.' };
}

const publishSchema = z.object({ pageId: z.string().min(1) });

export async function publishLandingPage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = publishSchema.safeParse({ pageId: formData.get('pageId') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  await prisma.landingPage.update({ where: { id: parsed.data.pageId }, data: { status: 'PUBLISHED', publishedAt: new Date() } });

  await recordActivity({ actorId: principal.userId, action: 'admin.landing_page_published', entityType: 'LandingPage', entityId: parsed.data.pageId });
  revalidatePath(`/admin/landing-pages/${parsed.data.pageId}`);
  revalidatePath('/admin/landing-pages');
  return { success: 'Published.' };
}

export async function unpublishLandingPage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const pageId = formData.get('pageId');
  if (typeof pageId !== 'string' || !pageId) {
    return { error: 'Invalid request.' };
  }

  await prisma.landingPage.update({ where: { id: pageId }, data: { status: 'DRAFT', publishedAt: null } });

  await recordActivity({ actorId: principal.userId, action: 'admin.landing_page_unpublished', entityType: 'LandingPage', entityId: pageId });
  revalidatePath(`/admin/landing-pages/${pageId}`);
  revalidatePath('/admin/landing-pages');
  return { success: 'Unpublished.' };
}

export async function archiveLandingPage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const pageId = formData.get('pageId');
  if (typeof pageId !== 'string' || !pageId) return { error: 'Invalid request.' };

  await prisma.landingPage.update({ where: { id: pageId }, data: { status: 'ARCHIVED', publishedAt: null } });
  await recordActivity({ actorId: principal.userId, action: 'admin.landing_page_archived', entityType: 'LandingPage', entityId: pageId });
  revalidatePath(`/admin/landing-pages/${pageId}`);
  revalidatePath('/admin/landing-pages');
  return { success: 'Archived.' };
}

export async function restoreLandingPage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const pageId = formData.get('pageId');
  if (typeof pageId !== 'string' || !pageId) return { error: 'Invalid request.' };

  await prisma.landingPage.update({ where: { id: pageId }, data: { status: 'DRAFT' } });
  await recordActivity({ actorId: principal.userId, action: 'admin.landing_page_restored', entityType: 'LandingPage', entityId: pageId });
  revalidatePath(`/admin/landing-pages/${pageId}`);
  revalidatePath('/admin/landing-pages');
  return { success: 'Restored to Draft.' };
}

// Hard delete — only a Draft that was never published, same reasoning
// as deleteNewsPost.
export async function deleteLandingPage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const pageId = formData.get('pageId');
  if (typeof pageId !== 'string' || !pageId) return { error: 'Invalid request.' };

  const page = await prisma.landingPage.findUnique({ where: { id: pageId } });
  if (!page) return { error: 'Not found.' };
  if (page.status !== 'DRAFT' || page.publishedAt) {
    return { error: 'Only an unpublished draft can be deleted — archive this instead.' };
  }

  await prisma.landingPage.delete({ where: { id: pageId } });
  await recordActivity({ actorId: principal.userId, action: 'admin.landing_page_deleted', entityType: 'LandingPage', entityId: pageId });
  revalidatePath('/admin/landing-pages');
  return { success: 'Draft deleted.' };
}
