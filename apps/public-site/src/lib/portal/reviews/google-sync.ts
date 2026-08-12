import { prisma } from '../db';
import { mergeIntegrationMetadata } from '../integrations/store';
import { fetchReviewsPage } from './google-api';

// Server-only. Never imported by a Client Component — the credential this
// reads (access token + Business Profile location) never leaves
// google-business-token.ts. Reuses the SAME GOOGLE_BUSINESS credential
// Settings → Integrations already stores per office — this file adds no
// new auth mechanism and no new env vars.

const STAR_RATING_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

// Safety cap, not a real-world limit — at 50/page this is 5,000 reviews,
// far beyond anything a single Business Profile location has. Exists
// only so a Google API bug that keeps returning a nextPageToken can never
// turn one Sync click into an unbounded loop.
const MAX_PAGES = 100;

export interface ReviewSyncResult {
  ok: boolean;
  error?: string;
  retrieved: number;
  created: number;
  updated: number;
  unchanged: number;
  skipped: number; // e.g. STAR_RATING_UNSPECIFIED — never invented, just not imported
  averageRating?: number;
  totalReviewCount?: number;
  syncedAt?: Date;
}

// A location's own Business Profile page (business.google.com) doesn't
// return an individually-shareable review URL from this API — only
// office.googleBusinessProfileUrl (already a field, admin-editable) is a
// verified link. Never constructed here.
export async function syncGoogleReviewsForOffice(officeId: string): Promise<ReviewSyncResult> {
  const result: ReviewSyncResult = { ok: true, retrieved: 0, created: 0, updated: 0, unchanged: 0, skipped: 0 };
  let pageToken: string | undefined;
  let pages = 0;

  try {
    do {
      const page = await fetchReviewsPage(officeId, { pageSize: 50, pageToken });
      if (page.kind !== 'OK') {
        return { ...result, ok: false, error: page.message };
      }
      pages += 1;

      const body = page.data;
      if (typeof body.averageRating === 'number') result.averageRating = body.averageRating;
      if (typeof body.totalReviewCount === 'number') result.totalReviewCount = body.totalReviewCount;

      for (const review of body.reviews ?? []) {
        result.retrieved += 1;
        const rating = STAR_RATING_MAP[review.starRating];
        if (!rating) {
          result.skipped += 1;
          continue;
        }

        const existing = await prisma.review.findUnique({
          where: { source_externalId: { source: 'GOOGLE', externalId: review.name } },
        });

        const data = {
          reviewerName: review.reviewer?.isAnonymous ? 'A Google user' : (review.reviewer?.displayName ?? 'A Google user'),
          reviewerPhotoUrl: review.reviewer?.isAnonymous ? null : (review.reviewer?.profilePhotoUrl ?? null),
          rating,
          reviewText: review.comment ?? '',
          reviewDate: new Date(review.createTime),
          lastSyncedAt: new Date(),
        };

        if (!existing) {
          await prisma.review.create({
            data: { source: 'GOOGLE', externalId: review.name, officeId, ...data },
          });
          result.created += 1;
        } else {
          const changed =
            existing.reviewerName !== data.reviewerName ||
            existing.reviewerPhotoUrl !== data.reviewerPhotoUrl ||
            existing.rating !== data.rating ||
            existing.reviewText !== data.reviewText;
          if (changed) {
            await prisma.review.update({ where: { id: existing.id }, data });
            result.updated += 1;
          } else {
            await prisma.review.update({ where: { id: existing.id }, data: { lastSyncedAt: data.lastSyncedAt } });
            result.unchanged += 1;
          }
        }
      }

      pageToken = body.nextPageToken;
    } while (pageToken && pages < MAX_PAGES);

    result.syncedAt = new Date();

    // Persist the verified Google-reported aggregate (never a locally
    // computed average of just our featured subset — see file-level
    // note) onto the SAME IntegrationConfig row's metadata, reusing the
    // field the schema already documents as "non-secret display data."
    if (result.averageRating !== undefined || result.totalReviewCount !== undefined) {
      await mergeIntegrationMetadata('GOOGLE_BUSINESS', officeId, {
        reviewsAverageRating: result.averageRating,
        reviewsTotalCount: result.totalReviewCount,
        reviewsLastSyncedAt: result.syncedAt.toISOString(),
      });
    }

    return result;
  } catch (error) {
    return {
      ...result,
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error while syncing Google reviews.',
    };
  }
}
