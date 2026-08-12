'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES, SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import { syncGoogleReviewsForOffice } from '../reviews/google-sync';
import { testGoogleReviewsConnection } from '../reviews/google-test';
import type { ActionState } from '../../../components/portal/ActionForm';

const REVIEWS_PATH = '/admin/reviews';

// Same "each button submits the exact target value, not a blind flip"
// pattern as togglePublishingDestination — idempotent, no race between
// two admins clicking the same row.
const flagSchema = z.object({
  reviewId: z.string().min(1),
  value: z.enum(['true', 'false']),
});

export async function setReviewFeatured(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);
  const parsed = flagSchema.safeParse({ reviewId: formData.get('reviewId'), value: formData.get('value') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const featured = parsed.data.value === 'true';
  await prisma.review.update({ where: { id: parsed.data.reviewId }, data: { featured } });
  await recordActivity({
    actorId: principal.userId,
    action: featured ? 'admin.review_featured' : 'admin.review_unfeatured',
    entityType: 'Review',
    entityId: parsed.data.reviewId,
  });
  revalidatePath(REVIEWS_PATH);
  revalidatePath('/');
  return { success: featured ? 'Review featured.' : 'Review unfeatured.' };
}

export async function setReviewPublished(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);
  const parsed = flagSchema.safeParse({ reviewId: formData.get('reviewId'), value: formData.get('value') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const published = parsed.data.value === 'true';
  await prisma.review.update({ where: { id: parsed.data.reviewId }, data: { published } });
  await recordActivity({
    actorId: principal.userId,
    action: published ? 'admin.review_published' : 'admin.review_hidden',
    entityType: 'Review',
    entityId: parsed.data.reviewId,
  });
  revalidatePath(REVIEWS_PATH);
  revalidatePath('/');
  return { success: published ? 'Review published.' : 'Review hidden.' };
}

const orderSchema = z.object({
  reviewId: z.string().min(1),
  displayOrder: z.coerce.number().int(),
});

export async function updateReviewDisplayOrder(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);
  const parsed = orderSchema.safeParse({ reviewId: formData.get('reviewId'), displayOrder: formData.get('displayOrder') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid display order.' };

  await prisma.review.update({ where: { id: parsed.data.reviewId }, data: { displayOrder: parsed.data.displayOrder } });
  revalidatePath(REVIEWS_PATH);
  revalidatePath('/');
  return { success: 'Display order updated.' };
}

const idSchema = z.object({ reviewId: z.string().min(1) });

// Deletes only the LOCAL record. Does not call Google, does not delete
// or modify the review on the customer's actual Google Business Profile
// — the Admin UI (ReviewRow) states this explicitly next to the button
// so it's never mistaken for removing the review from Google itself.
export async function deleteReviewRecord(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);
  const parsed = idSchema.safeParse({ reviewId: formData.get('reviewId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.review.delete({ where: { id: parsed.data.reviewId } });
  await recordActivity({
    actorId: principal.userId,
    action: 'admin.review_local_record_deleted',
    entityType: 'Review',
    entityId: parsed.data.reviewId,
  });
  revalidatePath(REVIEWS_PATH);
  revalidatePath('/');
  return { success: 'Local review record deleted (the review on Google is unaffected).' };
}

const syncSchema = z.object({ officeId: z.string().min(1) });

// SUPER_ADMIN_ONLY — matches Settings → Integrations' own gating for
// anything that calls out to a connected external credential (connect,
// reconnect, test). Never imports reviews — see google-test.ts's own
// comment on why this is intentionally distinct from Settings →
// Integrations' generic Test Connection.
export async function testGoogleReviewsConnectionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = syncSchema.safeParse({ officeId: formData.get('officeId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const result = await testGoogleReviewsConnection(parsed.data.officeId);

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.google_reviews_connection_tested',
    entityType: 'Office',
    entityId: parsed.data.officeId,
    metadata: { ok: result.ok, status: result.status },
  });

  revalidatePath(REVIEWS_PATH);
  return result.ok ? { success: result.message } : { error: result.message };
}

// SUPER_ADMIN_ONLY — matches Settings → Integrations' own gating for
// anything that calls out to a connected external credential (connect,
// reconnect, test), not the STAFF_ROLES level content-editing above.
export async function syncGoogleReviews(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = syncSchema.safeParse({ officeId: formData.get('officeId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const result = await syncGoogleReviewsForOffice(parsed.data.officeId);

  await recordActivity({
    actorId: principal.userId,
    action: 'admin.google_reviews_synced',
    entityType: 'Office',
    entityId: parsed.data.officeId,
    metadata: { ok: result.ok, retrieved: result.retrieved, created: result.created, updated: result.updated, skipped: result.skipped },
  });

  revalidatePath(REVIEWS_PATH);
  revalidatePath('/');

  if (!result.ok) {
    return { error: result.error ?? 'Sync failed.' };
  }
  return {
    success: `Synced ${result.retrieved} review${result.retrieved === 1 ? '' : 's'} — ${result.created} new, ${result.updated} updated, ${result.unchanged} unchanged${result.skipped ? `, ${result.skipped} skipped` : ''}.`,
  };
}
