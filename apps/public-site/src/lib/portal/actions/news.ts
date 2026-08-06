'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES, SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import { queueSocialPostsForNewsPost } from '../social/dispatch';
import type { ActionState } from '../../../components/portal/ActionForm';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const createSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.'),
  excerpt: z.string().trim().min(1, 'Excerpt is required.'),
  body: z.string().trim().min(1, 'Body is required.'),
});

export async function createNewsPost(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = createSchema.safeParse({
    title: formData.get('title'),
    excerpt: formData.get('excerpt'),
    body: formData.get('body'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const baseSlug = slugify(parsed.data.title);
  if (!baseSlug) {
    return { error: 'Title must contain at least one letter or number.' };
  }
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.newsPost.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const post = await prisma.newsPost.create({
    data: {
      title: parsed.data.title,
      slug,
      excerpt: parsed.data.excerpt,
      body: parsed.data.body,
      authorId: principal.userId,
    },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.news_post_created',
    entityType: 'NewsPost',
    entityId: post.id,
  });

  revalidatePath('/admin/news');
  redirect(`/admin/news/${post.id}`);
}

const updateSchema = z.object({
  postId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required.'),
  excerpt: z.string().trim().min(1, 'Excerpt is required.'),
  body: z.string().trim().min(1, 'Body is required.'),
  publishToOfficeIds: z.array(z.string()),
});

export async function updateNewsPost(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = updateSchema.safeParse({
    postId: formData.get('postId'),
    title: formData.get('title'),
    excerpt: formData.get('excerpt'),
    body: formData.get('body'),
    // Empty selection = "All Offices" (see social/dispatch.ts) — never
    // ambiguous with "not set yet," since a saved post always has this
    // field explicitly written on every save.
    publishToOfficeIds: formData.getAll('publishToOfficeIds').filter((v): v is string => typeof v === 'string'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  await prisma.newsPost.update({
    where: { id: parsed.data.postId },
    data: {
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      body: parsed.data.body,
      publishToOfficeIds: parsed.data.publishToOfficeIds,
    },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.news_post_updated',
    entityType: 'NewsPost',
    entityId: parsed.data.postId,
  });

  revalidatePath(`/admin/news/${parsed.data.postId}`);
  revalidatePath('/insights/news');
  return { success: 'Saved.' };
}

const publishSchema = z.object({ postId: z.string().min(1) });

export async function publishNewsPost(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = publishSchema.safeParse({ postId: formData.get('postId') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const post = await prisma.newsPost.update({
    where: { id: parsed.data.postId },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.news_post_published',
    entityType: 'NewsPost',
    entityId: post.id,
  });

  // Stage D: publishing a post is what queues its social packages —
  // "push not pull, site first" per the brief.
  await queueSocialPostsForNewsPost(post.id);

  revalidatePath(`/admin/news/${post.id}`);
  revalidatePath('/admin/news');
  revalidatePath('/insights/news');
  revalidatePath('/insights');
  revalidatePath('/insights/feed.xml');
  return { success: 'Published — now live on the public site.' };
}

const scheduleSchema = z.object({ postId: z.string().min(1), publishAt: z.string().min(1, 'Choose a date and time.') });

export async function scheduleNewsPost(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = scheduleSchema.safeParse({ postId: formData.get('postId'), publishAt: formData.get('publishAt') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const publishAt = new Date(parsed.data.publishAt);
  if (Number.isNaN(publishAt.getTime()) || publishAt.getTime() <= Date.now()) {
    return { error: 'Scheduled time must be in the future.' };
  }

  await prisma.newsPost.update({
    where: { id: parsed.data.postId },
    data: { status: 'SCHEDULED', publishedAt: publishAt },
  });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.news_post_scheduled',
    entityType: 'NewsPost',
    entityId: parsed.data.postId,
    metadata: { publishAt: publishAt.toISOString() },
  });

  revalidatePath(`/admin/news/${parsed.data.postId}`);
  revalidatePath('/admin/news');
  return { success: `Scheduled for ${publishAt.toLocaleString()}.` };
}

export async function unpublishNewsPost(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const postId = formData.get('postId');
  if (typeof postId !== 'string' || !postId) {
    return { error: 'Invalid request.' };
  }

  await prisma.newsPost.update({ where: { id: postId }, data: { status: 'DRAFT', publishedAt: null } });

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.news_post_unpublished',
    entityType: 'NewsPost',
    entityId: postId,
  });

  revalidatePath(`/admin/news/${postId}`);
  revalidatePath('/admin/news');
  revalidatePath('/insights/news');
  return { success: 'Unpublished — removed from the public site.' };
}

// Archive: off the public site (same effect as Unpublish) but marked
// distinctly from a working Draft — "this was deliberately retired,"
// not "not written yet." Kept indefinitely, never auto-deleted.
export async function archiveNewsPost(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const postId = formData.get('postId');
  if (typeof postId !== 'string' || !postId) {
    return { error: 'Invalid request.' };
  }

  await prisma.newsPost.update({ where: { id: postId }, data: { status: 'ARCHIVED', publishedAt: null } });
  await recordActivity({ actorId: principal.userId, action: 'admin.news_post_archived', entityType: 'NewsPost', entityId: postId });
  revalidatePath(`/admin/news/${postId}`);
  revalidatePath('/admin/news');
  revalidatePath('/insights/news');
  return { success: 'Archived.' };
}

export async function restoreNewsPost(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const postId = formData.get('postId');
  if (typeof postId !== 'string' || !postId) {
    return { error: 'Invalid request.' };
  }

  await prisma.newsPost.update({ where: { id: postId }, data: { status: 'DRAFT' } });
  await recordActivity({ actorId: principal.userId, action: 'admin.news_post_restored', entityType: 'NewsPost', entityId: postId });
  revalidatePath(`/admin/news/${postId}`);
  revalidatePath('/admin/news');
  return { success: 'Restored to Draft.' };
}

// Hard delete — only ever a Draft that was never published, so there's
// no public history or generated social package to lose. Anything that
// was ever live should be Archived instead.
export async function deleteNewsPost(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const postId = formData.get('postId');
  if (typeof postId !== 'string' || !postId) {
    return { error: 'Invalid request.' };
  }

  const post = await prisma.newsPost.findUnique({ where: { id: postId } });
  if (!post) return { error: 'Not found.' };
  if (post.status !== 'DRAFT' || post.publishedAt) {
    return { error: 'Only an unpublished draft can be deleted — archive this instead.' };
  }

  await prisma.newsPost.delete({ where: { id: postId } });
  await recordActivity({ actorId: principal.userId, action: 'admin.news_post_deleted', entityType: 'NewsPost', entityId: postId });
  revalidatePath('/admin/news');
  return { success: 'Draft deleted.' };
}

const seoSchema = z.object({
  postId: z.string().min(1),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  canonicalUrl: z.string().trim().optional(),
  ogTitle: z.string().trim().optional(),
  ogDescription: z.string().trim().optional(),
  structuredDataType: z.enum(['Article', 'NewsArticle', 'BlogPosting']),
});

// SEO/OG fields are all optional at the schema level (Section: NewsPost
// extensions) — this action lets an editor set them explicitly, but
// public rendering always falls back to title/excerpt/featuredImage when
// they're empty, so publishing is never blocked on filling these in.
export async function updateNewsSeo(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = seoSchema.safeParse({
    postId: formData.get('postId'),
    metaTitle: formData.get('metaTitle') || undefined,
    metaDescription: formData.get('metaDescription') || undefined,
    canonicalUrl: formData.get('canonicalUrl') || undefined,
    ogTitle: formData.get('ogTitle') || undefined,
    ogDescription: formData.get('ogDescription') || undefined,
    structuredDataType: formData.get('structuredDataType'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  await prisma.newsPost.update({
    where: { id: parsed.data.postId },
    data: {
      metaTitle: parsed.data.metaTitle ?? null,
      metaDescription: parsed.data.metaDescription ?? null,
      canonicalUrl: parsed.data.canonicalUrl ?? null,
      ogTitle: parsed.data.ogTitle ?? null,
      ogDescription: parsed.data.ogDescription ?? null,
      structuredDataType: parsed.data.structuredDataType,
    },
  });

  revalidatePath(`/admin/news/${parsed.data.postId}`);
  revalidatePath('/insights/news');
  return { success: 'SEO settings saved.' };
}

const featuredImageSchema = z.object({ postId: z.string().min(1), featuredImageId: z.string().optional(), ogImageId: z.string().optional() });

export async function updateNewsFeaturedImage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = featuredImageSchema.safeParse({
    postId: formData.get('postId'),
    featuredImageId: formData.get('featuredImageId') || undefined,
    ogImageId: formData.get('ogImageId') || undefined,
  });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  await prisma.newsPost.update({
    where: { id: parsed.data.postId },
    data: { featuredImageId: parsed.data.featuredImageId ?? null, ogImageId: parsed.data.ogImageId ?? null },
  });

  if (parsed.data.featuredImageId) {
    await prisma.mediaAssetUsage.upsert({
      where: { assetId_entityType_entityId: { assetId: parsed.data.featuredImageId, entityType: 'NewsPost', entityId: parsed.data.postId } },
      update: {},
      create: { assetId: parsed.data.featuredImageId, entityType: 'NewsPost', entityId: parsed.data.postId },
    });
  }

  revalidatePath(`/admin/news/${parsed.data.postId}`);
  revalidatePath('/insights/news');
  return { success: 'Featured image updated.' };
}

const addGalleryImageSchema = z.object({ postId: z.string().min(1), assetId: z.string().min(1) });

export async function addNewsGalleryImage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = addGalleryImageSchema.safeParse({ postId: formData.get('postId'), assetId: formData.get('assetId') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const count = await prisma.newsPostGalleryImage.count({ where: { newsPostId: parsed.data.postId } });
  await prisma.newsPostGalleryImage.create({
    data: { newsPostId: parsed.data.postId, assetId: parsed.data.assetId, sortOrder: count },
  });
  await prisma.mediaAssetUsage.upsert({
    where: { assetId_entityType_entityId: { assetId: parsed.data.assetId, entityType: 'NewsPost', entityId: parsed.data.postId } },
    update: {},
    create: { assetId: parsed.data.assetId, entityType: 'NewsPost', entityId: parsed.data.postId },
  });

  revalidatePath(`/admin/news/${parsed.data.postId}`);
  return { success: 'Added to gallery.' };
}

const taxonomySchema = z.object({ postId: z.string().min(1), tags: z.string().optional() });

function parseCsv(raw: FormDataEntryValue | undefined): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

// Categories are matched against existing rows only (a curated taxonomy,
// managed from the Media Library's "Create category" form) — tags are
// created on the fly, same folksonomy pattern as Media Library tags.
export async function updateNewsTaxonomy(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = taxonomySchema.safeParse({
    postId: formData.get('postId'),
    tags: formData.get('tags') || undefined,
  });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }
  const categoryIds = formData.getAll('categoryIds').filter((v): v is string => typeof v === 'string');

  const tagNames = parseCsv(parsed.data.tags);

  const tagIds: string[] = [];
  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!slug) continue;
    const tag = await prisma.tag.upsert({ where: { slug }, update: {}, create: { name, slug } });
    tagIds.push(tag.id);
  }

  await prisma.$transaction([
    prisma.newsPostCategory.deleteMany({ where: { newsPostId: parsed.data.postId } }),
    prisma.newsPostTag.deleteMany({ where: { newsPostId: parsed.data.postId } }),
    prisma.newsPostCategory.createMany({ data: categoryIds.map((categoryId) => ({ newsPostId: parsed.data.postId, categoryId })) }),
    prisma.newsPostTag.createMany({ data: tagIds.map((tagId) => ({ newsPostId: parsed.data.postId, tagId })) }),
  ]);

  revalidatePath(`/admin/news/${parsed.data.postId}`);
  revalidatePath('/insights/news');
  return { success: 'Categories and tags saved.' };
}

// Lazily flips any SCHEDULED post whose time has arrived to PUBLISHED.
// No worker/cron process exists in this app (see /PORTAL-PLAN.md §9 —
// apps/worker is an unbuilt stub), so this runs on every /admin/news
// visit instead — a documented, single-instance-appropriate limitation,
// same pattern as rate-limit.ts's in-memory store.
export async function sweepScheduledNewsPosts(): Promise<void> {
  const due = await prisma.newsPost.findMany({
    where: { status: 'SCHEDULED', publishedAt: { lte: new Date() } },
    select: { id: true },
  });
  if (due.length === 0) return;

  await prisma.newsPost.updateMany({
    where: { id: { in: due.map((p) => p.id) } },
    data: { status: 'PUBLISHED' },
  });

  for (const post of due) {
    await queueSocialPostsForNewsPost(post.id);
  }
}
