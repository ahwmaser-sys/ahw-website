import { describe, it, expect, vi, beforeEach } from 'vitest';

// mergeIntegrationMetadata (integrations/store.ts) is left un-mocked and
// runs for real against this mocked prisma — that's deliberate: it
// exercises the real read-then-write shallow-merge the lock relies on,
// not a hand-rolled stand-in that could silently drift from the real
// behavior.
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    integrationConfig: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    review: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../db', () => ({ prisma: prismaMock }));

const { fetchReviewsPageMock } = vi.hoisted(() => ({ fetchReviewsPageMock: vi.fn() }));
vi.mock('./google-api', () => ({ fetchReviewsPage: fetchReviewsPageMock }));

import { syncGoogleReviewsForOffice } from './google-sync';

interface FakeConfigRow {
  id: string;
  officeId: string | null;
  metadata: Record<string, unknown> | null;
}

// In-memory stand-in for the one IntegrationConfig row per office this
// suite cares about, wired to the mocked prisma calls the real
// lock/mergeIntegrationMetadata code path actually makes.
function wireFakeRows(rows: FakeConfigRow[]) {
  prismaMock.integrationConfig.findMany.mockImplementation(({ where }: { where: { type: string } }) => {
    return Promise.resolve(where.type === 'GOOGLE_BUSINESS' ? rows.map((r) => ({ ...r })) : []);
  });
  prismaMock.integrationConfig.findFirst.mockImplementation(({ where }: { where: { type: string; officeId: string | null } }) => {
    const row = rows.find((r) => r.officeId === where.officeId);
    return Promise.resolve(row ? { ...row } : null);
  });
  prismaMock.integrationConfig.update.mockImplementation(({ where, data }: { where: { id: string }; data: { metadata?: unknown } }) => {
    const row = rows.find((r) => r.id === where.id);
    if (row && data.metadata !== undefined) row.metadata = data.metadata as Record<string, unknown>;
    return row;
  });
}

const emptyPage = { kind: 'OK' as const, data: { reviews: [], totalReviewCount: 0, averageRating: 0 } };

describe('syncGoogleReviewsForOffice — locking/deduplication (shared across every office)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchReviewsPageMock.mockResolvedValue(emptyPage);
    prismaMock.review.findUnique.mockResolvedValue(null);
  });

  it('acquires and releases the lock around a normal sync — item 7: Sync Now is idempotent to run again after completion', async () => {
    const rows: FakeConfigRow[] = [{ id: 'egypt-row', officeId: 'egypt', metadata: {} }];
    wireFakeRows(rows);

    const result = await syncGoogleReviewsForOffice('egypt');

    expect(result.ok).toBe(true);
    expect((rows[0]!.metadata as Record<string, unknown>)['syncInProgress']).toBe(false);

    // Running it again immediately succeeds — the lock was released, not
    // left stuck after a clean run.
    const second = await syncGoogleReviewsForOffice('egypt');
    expect(second.ok).toBe(true);
  });

  it('refuses a second sync for the SAME office while one is already in progress — item 1: duplicate requests prevented', async () => {
    const rows: FakeConfigRow[] = [{ id: 'egypt-row', officeId: 'egypt', metadata: { syncInProgress: true, syncStartedAt: new Date().toISOString() } }];
    wireFakeRows(rows);

    const result = await syncGoogleReviewsForOffice('egypt');

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/already running/i);
    expect(fetchReviewsPageMock).not.toHaveBeenCalled();
  });

  it('refuses a sync for a DIFFERENT office while one office is already syncing — item 2: concurrent cross-office syncs prevented (shared project quota)', async () => {
    const rows: FakeConfigRow[] = [
      { id: 'egypt-row', officeId: 'egypt', metadata: { syncInProgress: true, syncStartedAt: new Date().toISOString() } },
      { id: 'kuwait-row', officeId: 'kuwait', metadata: {} },
    ];
    wireFakeRows(rows);

    const result = await syncGoogleReviewsForOffice('kuwait');

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/egypt/i);
    expect(fetchReviewsPageMock).not.toHaveBeenCalled();
  });

  it('treats a stale lock (older than the timeout) as free — a crashed sync cannot block forever', async () => {
    const staleTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 min ago, > 5 min timeout
    const rows: FakeConfigRow[] = [{ id: 'egypt-row', officeId: 'egypt', metadata: { syncInProgress: true, syncStartedAt: staleTimestamp } }];
    wireFakeRows(rows);

    const result = await syncGoogleReviewsForOffice('egypt');

    expect(result.ok).toBe(true);
    expect(fetchReviewsPageMock).toHaveBeenCalled();
  });

  it('releases the lock even when the sync throws — never leaves a permanent lock behind', async () => {
    const rows: FakeConfigRow[] = [{ id: 'egypt-row', officeId: 'egypt', metadata: {} }];
    wireFakeRows(rows);
    fetchReviewsPageMock.mockRejectedValueOnce(new Error('network error'));

    // fetchReviewsPage rejecting is caught inside the sync loop's own
    // try/catch (runGoogleReviewsSync), so this resolves with ok:false —
    // the lock's `finally` release still runs regardless.
    const result = await syncGoogleReviewsForOffice('egypt');

    expect(result.ok).toBe(false);
    expect((rows[0]!.metadata as Record<string, unknown>)['syncInProgress']).toBe(false);
  });

  it('uses the exact same function for two different offices — item 9: shared implementation, no office-specific branching', async () => {
    const rowsEgypt: FakeConfigRow[] = [{ id: 'egypt-row', officeId: 'egypt', metadata: {} }];
    wireFakeRows(rowsEgypt);
    const egyptResult = await syncGoogleReviewsForOffice('egypt');

    vi.clearAllMocks();
    fetchReviewsPageMock.mockResolvedValue(emptyPage);
    prismaMock.review.findUnique.mockResolvedValue(null);
    const rowsKuwait: FakeConfigRow[] = [{ id: 'kuwait-row', officeId: 'kuwait', metadata: {} }];
    wireFakeRows(rowsKuwait);
    const kuwaitResult = await syncGoogleReviewsForOffice('kuwait');

    expect(egyptResult.ok).toBe(true);
    expect(kuwaitResult.ok).toBe(true);
    // Same call shape passed to fetchReviewsPage regardless of office —
    // no per-office code path.
    expect(fetchReviewsPageMock).toHaveBeenCalledWith('kuwait', expect.objectContaining({ pageSize: 50 }));
  });
});
