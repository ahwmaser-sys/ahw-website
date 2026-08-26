import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listCampaigns, testConnection, type GoogleAdsCredential } from './google-ads';

// Regression coverage for the PAGE_SIZE_NOT_SUPPORTED bug: Google Ads
// API v19+ rejects any pageSize/page_size on GoogleAdsService.Search.
// This is the one shared search function every Google Ads call in this
// file goes through (listCampaigns, listConversionActions,
// testConnection, setCampaignStatus's read of gaqlSearch indirectly
// isn't exercised here since it doesn't search) — so asserting no
// request body to googleAds:search ever contains pageSize/page_size,
// regardless of which credential (Egypt, Kuwait, any future account)
// is passed in, covers every caller at once.

const credential: GoogleAdsCredential = {
  refreshToken: 'fake-refresh-token',
  customerId: '952-673-2923',
  loginCustomerId: '607-789-3682',
};

function tokenResponse() {
  return new Response(JSON.stringify({ access_token: 'fake-access-token' }), { status: 200 });
}

function searchResponse(results: Record<string, unknown>[], nextPageToken?: string) {
  return new Response(JSON.stringify({ results, ...(nextPageToken ? { nextPageToken } : {}) }), { status: 200 });
}

type FetchCall = [RequestInfo | URL, RequestInit | undefined];

function parseBody(init: RequestInit | undefined): Record<string, unknown> {
  return JSON.parse(init?.body as string) as Record<string, unknown>;
}

describe('google-ads gaqlSearch (via its exported callers)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client-id');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-client-secret');
    vi.stubEnv('GOOGLE_ADS_DEVELOPER_TOKEN', 'test-developer-token');
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('never sends pageSize or page_size on a googleAds:search request', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(searchResponse([{ customer: { id: '9526732923', descriptiveName: 'AHW Egypt' } }]));

    await testConnection(credential);

    const searchCalls = (fetchMock.mock.calls as FetchCall[]).filter(([url]) => (url as string).includes('googleAds:search'));
    expect(searchCalls.length).toBeGreaterThan(0);
    for (const [, init] of searchCalls) {
      const body = parseBody(init);
      expect(body).not.toHaveProperty('pageSize');
      expect(body).not.toHaveProperty('page_size');
    }
  });

  it('still paginates correctly via pageToken/nextPageToken across multiple pages', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        searchResponse(
          [{ campaign: { id: '1', name: 'Campaign One', status: 'ENABLED' }, metrics: { costMicros: '1000000', impressions: '10', clicks: '1' } }],
          'page-2-token'
        )
      )
      .mockResolvedValueOnce(
        searchResponse([{ campaign: { id: '2', name: 'Campaign Two', status: 'PAUSED' }, metrics: { costMicros: '2000000', impressions: '20', clicks: '2' } }])
      );

    const campaigns = await listCampaigns(credential);

    expect(campaigns).toHaveLength(2);
    expect(campaigns.map((c) => c.externalCampaignId).sort()).toEqual(['1', '2']);

    const searchCalls = (fetchMock.mock.calls as FetchCall[]).filter(([url]) => (url as string).includes('googleAds:search'));
    expect(searchCalls).toHaveLength(2);
    const secondCallBody = parseBody(searchCalls[1]![1]);
    expect(secondCallBody['pageToken']).toBe('page-2-token');
  });

  it('works identically for a different customer/manager account (account-agnostic)', async () => {
    const otherCredential: GoogleAdsCredential = {
      refreshToken: 'kuwait-refresh-token',
      customerId: '111-222-3333',
      loginCustomerId: '444-555-6666',
    };

    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(searchResponse([{ customer: { id: '1112223333', descriptiveName: 'AHW Kuwait' } }]));

    const result = await testConnection(otherCredential);

    expect(result.customerId).toBe('1112223333');
    const [, searchInit] = (fetchMock.mock.calls as FetchCall[]).find(([url]) => (url as string).includes('googleAds:search'))!;
    const headers = searchInit?.headers as Record<string, string>;
    expect(headers['login-customer-id']).toBe('4445556666');
    const body = parseBody(searchInit);
    expect(body).not.toHaveProperty('pageSize');
    expect(body).not.toHaveProperty('page_size');
  });
});
