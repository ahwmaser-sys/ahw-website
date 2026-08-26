import { prisma } from '../db';
import { mergeIntegrationMetadata } from '../integrations/store';
import { fetchReviewsPage } from './google-api';

// All GOOGLE_BUSINESS offices share ONE Google Cloud project (same
// GOOGLE_CLIENT_ID/SECRET as every other Google integration in this
// app), which means they share ONE project-level API quota too — a
// sync running for Egypt and a sync running for Kuwait at the same
// moment would stack two request streams against that same shared
// quota. The lock below is deliberately cross-office: it checks every
// GOOGLE_BUSINESS row, not just this office's own, so "one office's
// sync can't burst another office's headroom" (and a double-click on
// the same office's Sync Now button) are the same guarantee.
//
// This is a best-effort lock (a read-then-write on IntegrationConfig
// .metadata, not a database-enforced atomic lock) — correct enough for
// this app's actual scale (a handful of admins clicking a button by
// hand, never a high-concurrency path) without introducing a new
// locking primitive (e.g. a Postgres advisory lock) this codebase has
// never used anywhere else. STALE_LOCK_MS bounds the downside: a sync
// that crashed mid-run without releasing the lock can never block
// syncing for longer than this.
const STALE_LOCK_MS = 5 * 60 * 1000;

interface SyncLockMetadata {
  syncInProgress?: boolean;
  syncStartedAt?: string;
}

export interface SyncLockResult {
  acquired: boolean;
  /** Which office's sync is currently holding the lock, when acquired is false. */
  heldByOfficeId?: string | null;
}

async function acquireGoogleBusinessSyncLock(officeId: string): Promise<SyncLockResult> {
  const rows = await prisma.integrationConfig.findMany({ where: { type: 'GOOGLE_BUSINESS' } });
  const now = Date.now();
  for (const row of rows) {
    const meta = (row.metadata as SyncLockMetadata | null) ?? {};
    if (!meta.syncInProgress) continue;
    const startedAtMs = meta.syncStartedAt ? Date.parse(meta.syncStartedAt) : NaN;
    const isStale = Number.isNaN(startedAtMs) || now - startedAtMs >= STALE_LOCK_MS;
    if (!isStale) return { acquired: false, heldByOfficeId: row.officeId };
  }
  await mergeIntegrationMetadata('GOOGLE_BUSINESS', officeId, { syncInProgress: true, syncStartedAt: new Date(now).toISOString() });
  return { acquired: true };
}

async function releaseGoogleBusinessSyncLock(officeId: string): Promise<void> {
  await mergeIntegrationMetadata('GOOGLE_BUSINESS', officeId, { syncInProgress: false });
}

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
  const lock = await acquireGoogleBusinessSyncLock(officeId);
  if (!lock.acquired) {
    return {
      ok: false,
      retrieved: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: 0,
      error:
        lock.heldByOfficeId === officeId
          ? 'A sync for this office is already running — wait for it to finish before starting another.'
          : `A Google Business Profile sync is already running for another office (${lock.heldByOfficeId ?? 'unknown'}) — it shares the same Google Cloud project quota, so this waits its turn. Try again shortly.`,
    };
  }

  try {
    return await runGoogleReviewsSync(officeId);
  } finally {
    await releaseGoogleBusinessSyncLock(officeId);
  }
}

async function runGoogleReviewsSync(officeId: string): Promise<ReviewSyncResult> {
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
