'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES, SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import { runMediaPipeline } from '../media/pipeline';
import { publications as legacyPublications, buildCreateData } from '../publication-legacy-import';
import type { ActionState } from '../../../components/portal/ActionForm';
import type { Prisma } from '@prisma/client';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseCsv(raw: FormDataEntryValue | undefined): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

const revalidatePublic = (slug?: string) => {
  revalidatePath('/insights/publications');
  if (slug) revalidatePath(`/insights/publications/${slug}`);
  revalidatePath('/insights');
  revalidatePath('/');
};

// ── Create ──

const createSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.'),
  outlet: z.string().trim().min(1, 'Outlet is required.'),
  url: z.string().trim().url('Enter a valid URL.'),
  date: z.string().trim().min(1, 'Date is required.'),
});

export async function createPublication(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = createSchema.safeParse({
    title: formData.get('title'),
    outlet: formData.get('outlet'),
    url: formData.get('url'),
    date: formData.get('date'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const baseSlug = slugify(parsed.data.title);
  if (!baseSlug) return { error: 'Title must contain at least one letter or number.' };
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.publication.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const pub = await prisma.publication.create({
    data: {
      title: parsed.data.title,
      slug,
      outlet: parsed.data.outlet,
      url: parsed.data.url,
      date: new Date(parsed.data.date),
      excerpt: '',
    },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.publication_created', entityType: 'Publication', entityId: pub.id });
  revalidatePath('/admin/publications');
  redirect(`/admin/publications/${pub.id}`);
}

// ── Metadata ──

const metadataSchema = z.object({
  publicationId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required.'),
  slug: z.string().trim().min(1, 'Slug is required.'),
  outlet: z.string().trim().min(1, 'Outlet is required.'),
  url: z.string().trim().url('Enter a valid URL.'),
  date: z.string().trim().min(1, 'Date is required.'),
  readingTime: z.string().trim().optional(),
  tags: z.string().optional(),
  isFeatured: z.string().optional(),
});

export async function updatePublicationMetadata(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = metadataSchema.safeParse({
    publicationId: formData.get('publicationId'),
    title: formData.get('title'),
    slug: formData.get('slug'),
    outlet: formData.get('outlet'),
    url: formData.get('url'),
    date: formData.get('date'),
    readingTime: formData.get('readingTime') || undefined,
    tags: formData.get('tags') || undefined,
    isFeatured: formData.get('isFeatured') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const existing = await prisma.publication.findUnique({ where: { id: parsed.data.publicationId }, select: { slug: true } });
  if (!existing) return { error: 'Not found.' };

  const pub = await prisma.publication.update({
    where: { id: parsed.data.publicationId },
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      outlet: parsed.data.outlet,
      url: parsed.data.url,
      date: new Date(parsed.data.date),
      readingTime: parsed.data.readingTime || null,
      tags: parseCsv(parsed.data.tags),
      isFeatured: parsed.data.isFeatured === 'on',
    },
  });

  revalidatePath(`/admin/publications/${pub.id}`);
  revalidatePublic(existing.slug);
  if (pub.slug !== existing.slug) revalidatePublic(pub.slug);
  return { success: 'Saved.' };
}

// ── Content ──

const contentSchema = z.object({
  publicationId: z.string().min(1),
  excerpt: z.string().trim().min(1, 'Excerpt is required.'),
  content: z.string().trim().optional(),
});

export async function updatePublicationContent(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = contentSchema.safeParse({
    publicationId: formData.get('publicationId'),
    excerpt: formData.get('excerpt'),
    content: formData.get('content') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const pub = await prisma.publication.update({
    where: { id: parsed.data.publicationId },
    data: { excerpt: parsed.data.excerpt, content: parsed.data.content || null },
  });

  revalidatePath(`/admin/publications/${pub.id}`);
  revalidatePublic(pub.slug);
  return { success: 'Saved.' };
}

// ── Cover image ──

async function uploadImageAsset(file: File, uploadedById: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const pipelineResult = await runMediaPipeline({
    buffer,
    fileName: file.name,
    declaredType: file.type,
    kind: 'IMAGE',
    generateVariants: true,
  });
  return prisma.mediaAsset.create({
    data: {
      kind: 'IMAGE',
      storageKey: pipelineResult.storageKey,
      fileName: file.name,
      fileType: pipelineResult.fileType,
      fileSize: pipelineResult.fileSize,
      width: pipelineResult.width,
      height: pipelineResult.height,
      orientation: pipelineResult.orientation,
      dominantColors: pipelineResult.dominantColors,
      uploadedById,
      variants: { create: pipelineResult.variants.map((v) => ({ purpose: v.purpose, storageKey: v.storageKey, width: v.width, height: v.height })) },
    },
  });
}

const coverImageSchema = z.object({ publicationId: z.string().min(1), coverImageCaption: z.string().trim().optional() });

export async function setPublicationCoverImage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = coverImageSchema.safeParse({
    publicationId: formData.get('publicationId'),
    coverImageCaption: formData.get('coverImageCaption') || undefined,
  });
  if (!parsed.success) return { error: 'Invalid request.' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose an image file.' };

  let asset;
  try {
    asset = await uploadImageAsset(file, principal.userId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Upload failed.' };
  }

  const pub = await prisma.publication.update({
    where: { id: parsed.data.publicationId },
    data: { coverImageId: asset.id, coverImageUrl: null, coverImageCaption: parsed.data.coverImageCaption || null },
  });

  await prisma.mediaAssetUsage.upsert({
    where: { assetId_entityType_entityId: { assetId: asset.id, entityType: 'Publication', entityId: parsed.data.publicationId } },
    update: {},
    create: { assetId: asset.id, entityType: 'Publication', entityId: parsed.data.publicationId },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.publication_image_set', entityType: 'Publication', entityId: parsed.data.publicationId });
  revalidatePath(`/admin/publications/${parsed.data.publicationId}`);
  revalidatePublic(pub.slug);
  return { success: 'Image updated.' };
}

export async function clearPublicationCoverImage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = z.object({ publicationId: z.string().min(1) }).safeParse({ publicationId: formData.get('publicationId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const pub = await prisma.publication.update({
    where: { id: parsed.data.publicationId },
    data: { coverImageId: null, coverImageUrl: null },
  });

  revalidatePath(`/admin/publications/${parsed.data.publicationId}`);
  revalidatePublic(pub.slug);
  return { success: 'Image cleared.' };
}

// ── Related projects ──

const relatedSchema = z.object({
  publicationId: z.string().min(1),
  relatedProjectSlugs: z.array(z.string()),
});

export async function updatePublicationRelated(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = relatedSchema.safeParse({
    publicationId: formData.get('publicationId'),
    relatedProjectSlugs: formData.getAll('relatedProjectSlugs').filter((v): v is string => typeof v === 'string'),
  });
  if (!parsed.success) return { error: 'Invalid request.' };

  const pub = await prisma.publication.update({
    where: { id: parsed.data.publicationId },
    data: { relatedProjectSlugs: parsed.data.relatedProjectSlugs },
  });

  revalidatePath(`/admin/publications/${pub.id}`);
  revalidatePublic(pub.slug);
  return { success: 'Saved.' };
}

// ── Publish / Unpublish / Delete ──

const publishSchema = z.object({ publicationId: z.string().min(1) });

export async function publishPublication(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = publishSchema.safeParse({ publicationId: formData.get('publicationId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const existing = await prisma.publication.findUnique({ where: { id: parsed.data.publicationId } });
  if (!existing) return { error: 'Not found.' };
  if (!existing.excerpt) return { error: 'Add an excerpt before publishing.' };

  const pub = await prisma.publication.update({ where: { id: parsed.data.publicationId }, data: { status: 'PUBLISHED' } });
  await recordActivity({ actorId: principal.userId, action: 'admin.publication_published', entityType: 'Publication', entityId: pub.id });

  revalidatePath(`/admin/publications/${pub.id}`);
  revalidatePath('/admin/publications');
  revalidatePublic(pub.slug);
  return { success: 'Published — now live on the public site.' };
}

export async function unpublishPublication(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = publishSchema.safeParse({ publicationId: formData.get('publicationId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const pub = await prisma.publication.update({ where: { id: parsed.data.publicationId }, data: { status: 'DRAFT' } });
  await recordActivity({ actorId: principal.userId, action: 'admin.publication_unpublished', entityType: 'Publication', entityId: pub.id });

  revalidatePath(`/admin/publications/${pub.id}`);
  revalidatePath('/admin/publications');
  revalidatePublic(pub.slug);
  return { success: 'Unpublished — removed from the public site.' };
}

export async function deletePublication(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = publishSchema.safeParse({ publicationId: formData.get('publicationId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const pub = await prisma.publication.findUnique({ where: { id: parsed.data.publicationId } });
  if (!pub) return { error: 'Not found.' };
  if (pub.status === 'PUBLISHED') return { error: 'Unpublish before deleting.' };

  await prisma.publication.delete({ where: { id: parsed.data.publicationId } });
  await recordActivity({ actorId: principal.userId, action: 'admin.publication_deleted', entityType: 'Publication', entityId: parsed.data.publicationId });

  revalidatePath('/admin/publications');
  revalidatePublic(pub.slug);
  redirect('/admin/publications');
}

// ── One-time legacy import ──
// Ports every entry from the static packages/ui-components/src/data/
// publications.ts file into real rows — see
// scripts/migrate-publications.ts for the standalone-script equivalent
// (can't reach production's DATABASE_URL from a local shell, since
// Vercel marks it sensitive; this in-app action is how the real
// one-time production import actually runs). Shares its exact mapping
// logic with that script via publication-legacy-import.ts. Idempotent —
// skips any slug that already exists, never overwrites.

export async function previewLegacyPublicationsImport(_prevState: ActionState, _formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const existingSlugs = new Set((await prisma.publication.findMany({ select: { slug: true } })).map((p) => p.slug));
  const toCreate = legacyPublications.filter((p) => !existingSlugs.has(p.slug));

  return {
    success: `Preview: ${toCreate.length} publication(s) would be imported, ${legacyPublications.length - toCreate.length} already exist and would be skipped.`,
  };
}

export async function runLegacyPublicationsImport(_prevState: ActionState, _formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  let created = 0;
  let skipped = 0;

  for (const pub of legacyPublications) {
    const existing = await prisma.publication.findUnique({ where: { slug: pub.slug }, select: { id: true } });
    if (existing) {
      skipped += 1;
      continue;
    }
    const data: Prisma.PublicationCreateInput = buildCreateData(pub);
    await prisma.publication.create({ data });
    created += 1;
  }

  await recordActivity({ actorId: principal.userId, action: 'admin.publication_legacy_import_run', entityType: 'Publication', metadata: { created, skipped } });

  revalidatePath('/admin/publications');
  revalidatePublic();
  return { success: `Imported ${created} publication(s), skipped ${skipped} already-migrated.` };
}
