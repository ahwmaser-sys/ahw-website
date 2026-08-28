import { prisma } from '../db';
import type { Prisma, ReviewSource } from '@prisma/client';
import type { BrandReviewSettings } from '../brand-kit';

export interface ReviewFilters {
  officeId?: string | undefined;
  published?: boolean | undefined;
  featured?: boolean | undefined;
  rating?: number | undefined;
  source?: ReviewSource | undefined;
}

export async function listReviews(filters: ReviewFilters = {}) {
  const where: Prisma.ReviewWhereInput = {
    ...(filters.officeId ? { officeId: filters.officeId } : {}),
    ...(filters.published !== undefined ? { published: filters.published } : {}),
    ...(filters.featured !== undefined ? { featured: filters.featured } : {}),
    ...(filters.rating !== undefined ? { rating: filters.rating } : {}),
    ...(filters.source ? { source: filters.source } : {}),
  };
  return prisma.review.findMany({
    where,
    include: { office: { select: { displayName: true, slug: true, googleBusinessProfileUrl: true } } },
    orderBy: [{ displayOrder: 'asc' }, { reviewDate: 'desc' }],
  });
}

export async function getReviewById(id: string) {
  return prisma.review.findUnique({ where: { id }, include: { office: true } });
}

// Admin → Reviews dashboard header counts — total imported vs. currently
// published, scoped to one office. Plain counts, not derived from
// listReviews's already-fetched page, so the header stays correct even
// if the table below is filtered down to a subset.
export async function getReviewCounts(officeId: string): Promise<{ total: number; published: number }> {
  const [total, published] = await Promise.all([
    prisma.review.count({ where: { officeId } }),
    prisma.review.count({ where: { officeId, published: true } }),
  ]);
  return { total, published };
}

// Homepage-facing: only what's editorially approved (see the schema's
// file-level comment — a synced review is never auto-published), scoped
// to one office, ordered for display.
export async function getPublishedFeaturedReviews(officeId: string, limit = 6) {
  return prisma.review.findMany({
    where: { officeId, published: true, featured: true },
    orderBy: [{ displayOrder: 'asc' }, { reviewDate: 'desc' }],
    take: limit,
  });
}

// The verified Google-reported rating/count for an office, as stored by
// the last successful sync (google-sync.ts) — never computed from just
// the featured subset, never invented when no sync has run yet.
export async function getGoogleReviewsAggregate(officeId: string): Promise<{ averageRating: number; totalCount: number; lastSyncedAt: string } | null> {
  const config = await prisma.integrationConfig.findFirst({ where: { type: 'GOOGLE_BUSINESS', officeId } });
  const metadata = (config?.metadata as Record<string, unknown> | null) ?? null;
  if (!metadata || typeof metadata.reviewsAverageRating !== 'number' || typeof metadata.reviewsTotalCount !== 'number') {
    return null;
  }
  return {
    averageRating: metadata.reviewsAverageRating,
    totalCount: metadata.reviewsTotalCount,
    lastSyncedAt: typeof metadata.reviewsLastSyncedAt === 'string' ? metadata.reviewsLastSyncedAt : '',
  };
}

// Gates only the "based on N Google reviews" text on the homepage — never
// the rating, Google attribution, or review cards, and never the stored
// count itself. `totalCount` here must always be the real, verified
// Google-reported total (getGoogleReviewsAggregate's return value, never
// the number of reviews an admin has featured/published) — that is the
// exact distinction section 16 of the go-live brief calls out.
export function shouldShowReviewCount(settings: BrandReviewSettings, totalCount: number): boolean {
  switch (settings.countDisplayMode) {
    case 'ALWAYS_HIDE':
      return false;
    case 'ALWAYS_SHOW':
      return true;
    case 'THRESHOLD':
      return totalCount >= settings.countThreshold;
  }
}
