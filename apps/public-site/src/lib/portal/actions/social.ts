'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES } from '../roles';
import { prisma } from '../db';
import { socialAdapters } from '../social/adapter';
import { isPubliclyVisible } from '../media/public-visibility';
import { recordActivity } from '../audit';
import { getSiteUrl } from '../../site-config';
import type { ActionState } from '../../../components/portal/ActionForm';

const schema = z.object({ socialPostId: z.string().min(1), postId: z.string().min(1) });

// Manual retry, admin-triggered — there's no background worker in this
// app (apps/worker is an unbuilt stub, see /PORTAL-PLAN.md §9), so a
// FAILED row's retry-with-backoff happens when an admin clicks Retry,
// not on an automatic schedule. Documented limitation, same pattern as
// the in-memory rate limiter and the news-post scheduling sweep.
export async function retrySocialPost(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = schema.safeParse({ socialPostId: formData.get('socialPostId'), postId: formData.get('postId') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const socialPost = await prisma.socialPost.findUnique({ where: { id: parsed.data.socialPostId }, include: { newsPost: true } });
  if (!socialPost) {
    return { error: 'Not found.' };
  }

  const adapter = socialAdapters.find((a) => a.platform === socialPost.platform);
  if (!adapter) {
    return { error: 'Unknown platform.' };
  }

  const siteUrl = await getSiteUrl();
  let imageUrl: string | undefined;
  if (socialPost.newsPost.featuredImageId && (await isPubliclyVisible(socialPost.newsPost.featuredImageId))) {
    imageUrl = `${siteUrl}/api/media/${socialPost.newsPost.featuredImageId}`;
  }

  const content = adapter.formatContent({
    title: socialPost.newsPost.title,
    excerpt: socialPost.newsPost.excerpt,
    slug: socialPost.newsPost.slug,
    imageUrl,
    siteUrl,
  });

  if (!(await adapter.isConfigured(socialPost.officeId))) {
    await prisma.socialPost.update({
      where: { id: socialPost.id },
      data: { mode: 'MANUAL', status: 'MANUAL', caption: content.caption, errorMessage: null },
    });
    revalidatePath(`/admin/news/${parsed.data.postId}`);
    return { success: 'Package regenerated — no credentials configured, still manual.' };
  }

  try {
    const result = await adapter.publish(content, socialPost.officeId);
    await prisma.socialPost.update({
      where: { id: socialPost.id },
      data: {
        status: 'POSTED',
        permalink: result.permalink,
        postedAt: new Date(),
        errorMessage: null,
        attemptCount: { increment: 1 },
      },
    });
    revalidatePath(`/admin/news/${parsed.data.postId}`);
    return { success: 'Posted.' };
  } catch (error) {
    await prisma.socialPost.update({
      where: { id: socialPost.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error.',
        attemptCount: { increment: 1 },
      },
    });
    revalidatePath(`/admin/news/${parsed.data.postId}`);
    return { error: 'Retry failed — see error on the card.' };
  }
}

const deleteSocialPostSchema = z.object({ socialPostId: z.string().min(1), postId: z.string().min(1) });

// A POSTED row is a historical record of something that actually
// happened on the platform — deleting it here wouldn't un-post it, just
// falsify this app's own record of what was published. Only a
// not-yet-real row (PENDING/MANUAL/FAILED) is safe to remove.
export async function deleteSocialPost(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = deleteSocialPostSchema.safeParse({ socialPostId: formData.get('socialPostId'), postId: formData.get('postId') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const socialPost = await prisma.socialPost.findUnique({ where: { id: parsed.data.socialPostId } });
  if (!socialPost) return { error: 'Not found.' };
  if (socialPost.status === 'POSTED') {
    return { error: "This was actually posted — deleting the record here wouldn't remove it from the platform, so it stays as history." };
  }

  await prisma.socialPost.delete({ where: { id: socialPost.id } });
  await recordActivity({ actorId: principal.userId, action: 'admin.social_post_deleted', entityType: 'SocialPost', entityId: parsed.data.socialPostId });
  revalidatePath(`/admin/news/${parsed.data.postId}`);
  return { success: 'Removed.' };
}
