'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES } from '../roles';
import { prisma } from '../db';
import { isRateLimited } from '../rate-limit';
import { getActiveAIProvider } from '../ai/registry';
import { getOfficeById } from '../offices';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

const generatePackageSchema = z.object({
  postId: z.string().min(1),
  language: z.string().trim().optional(),
  // "Global" (omitted/empty) or a specific office id — independent of the
  // post's own Publishing Target (publishToOfficeIds); an editor drafting
  // for one office ahead of deciding final distribution can still ask the
  // AI to write for that office's context.
  officeId: z.string().trim().optional(),
});

// Explicit, per-post, admin-triggered — never automatic on save or
// publish. AI output lands in the aiXxx suggestion fields, always
// reviewed and applied by a human, never auto-overwriting the live
// metaTitle/metaDescription the editor wrote.
export async function generateArticleAIPackage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  // Real API calls cost real money per request — reuses the same
  // sliding-window limiter as login/password-reset, a different key.
  if (await isRateLimited(`ai-content:${principal.userId}`, 20, 1000 * 60 * 15)) {
    return { error: 'Too many AI generation requests. Try again later.' };
  }

  const parsed = generatePackageSchema.safeParse({
    postId: formData.get('postId'),
    language: formData.get('language') || undefined,
    officeId: formData.get('officeId') || undefined,
  });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const post = await prisma.newsPost.findUnique({ where: { id: parsed.data.postId } });
  if (!post) {
    return { error: 'Article not found.' };
  }

  const provider = await getActiveAIProvider();
  if (!(await provider.isConfigured())) {
    return { error: 'AI content generation is not configured. Set a provider and API key in AI Settings first.' };
  }

  const office = parsed.data.officeId ? await getOfficeById(parsed.data.officeId) : null;

  let result;
  try {
    result = await provider.generateContentPackage({
      title: post.title,
      excerpt: post.excerpt,
      body: post.body,
      ...(parsed.data.language ? { language: parsed.data.language } : {}),
      ...(office
        ? { officeContext: { displayName: office.displayName, city: office.city, country: office.country, ...(office.ctaLabel ? { ctaLabel: office.ctaLabel } : {}) } }
        : {}),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'AI generation failed.' };
  }

  await prisma.newsPost.update({
    where: { id: post.id },
    data: {
      aiSeoTitle: result.seoTitle,
      aiMetaDescription: result.metaDescription,
      aiAltText: result.altText ?? null,
      aiCaption: result.caption,
      aiSuggestedHashtags: [...result.hashtags],
      aiSuggestedKeywords: [...result.keywords],
      aiSuggestedCta: result.suggestedCta,
      aiMarketingSummary: result.marketingSummary,
    },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.ai_content_generated', entityType: 'NewsPost', entityId: post.id });
  revalidatePath(`/admin/news/${post.id}`);
  return { success: 'AI content package generated — review and apply below.' };
}

const applySeoSchema = z.object({ postId: z.string().min(1) });

// Human-in-the-loop "apply" step, separate from generation — copies the
// AI suggestion into the live SEO fields only when an editor explicitly
// confirms it.
export async function applyAISeoSuggestions(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = applySeoSchema.safeParse({ postId: formData.get('postId') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const post = await prisma.newsPost.findUnique({ where: { id: parsed.data.postId } });
  if (!post) {
    return { error: 'Article not found.' };
  }
  if (!post.aiSeoTitle && !post.aiMetaDescription) {
    return { error: 'No AI suggestions to apply yet — generate a package first.' };
  }

  await prisma.newsPost.update({
    where: { id: post.id },
    data: {
      metaTitle: post.aiSeoTitle ?? post.metaTitle,
      metaDescription: post.aiMetaDescription ?? post.metaDescription,
    },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.ai_seo_applied', entityType: 'NewsPost', entityId: post.id });
  revalidatePath(`/admin/news/${post.id}`);
  return { success: 'AI-suggested SEO title and description applied.' };
}

const generateTagsSchema = z.object({ assetId: z.string().min(1) });

export async function generateAssetAITags(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  if (await isRateLimited(`ai-content:${principal.userId}`, 20, 1000 * 60 * 15)) {
    return { error: 'Too many AI generation requests. Try again later.' };
  }

  const parsed = generateTagsSchema.safeParse({ assetId: formData.get('assetId') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const asset = await prisma.mediaAsset.findUnique({ where: { id: parsed.data.assetId } });
  if (!asset) {
    return { error: 'Asset not found.' };
  }

  const provider = await getActiveAIProvider();
  if (!(await provider.isConfigured())) {
    return { error: 'AI content generation is not configured. Set a provider and API key in AI Settings first.' };
  }

  // The provider needs a fetchable URL — signs one just for this call
  // rather than exposing the asset publicly.
  const { signMediaToken } = await import('../signed-url');
  const token = signMediaToken(asset.id, 120);
  const { getSiteUrl } = await import('../../site-config');
  const baseUrl = await getSiteUrl();

  let tags: readonly string[];
  try {
    tags = await provider.generateImageTags(`${baseUrl}/api/portal/media-download?token=${token}`);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'AI tagging failed.' };
  }

  await prisma.mediaAsset.update({ where: { id: asset.id }, data: { aiTags: [...tags] } });

  await recordActivity({ actorId: principal.userId, action: 'admin.ai_tags_generated', entityType: 'MediaAsset', entityId: asset.id });
  revalidatePath(`/admin/media/${asset.id}`);
  return { success: `Generated ${tags.length} AI tag(s).` };
}
