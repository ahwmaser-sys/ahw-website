import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { getFreshGoogleBusinessAccessTokenMock } = vi.hoisted(() => ({ getFreshGoogleBusinessAccessTokenMock: vi.fn() }));
vi.mock('./google-business-token', () => ({ getFreshGoogleBusinessAccessToken: getFreshGoogleBusinessAccessTokenMock }));

// GOOGLE_BUSINESS is the only case under test here; every other
// integration type's own testIntegration branch calls
// getIntegrationCredential directly and is untouched by this fix, so it
// doesn't need mocking for these tests to run.
vi.mock('./store', () => ({ getIntegrationCredential: vi.fn() }));

import { testIntegration } from './test';

function quotaZeroBody() {
  return JSON.stringify({
    error: {
      code: 429,
      status: 'RESOURCE_EXHAUSTED',
      message: "Quota exceeded for quota metric 'Requests' and limit 'Requests per minute'",
      details: [
        {
          '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
          reason: 'RATE_LIMIT_EXCEEDED',
          metadata: { quota_limit_value: '0' },
        },
      ],
    },
  });
}

describe('testIntegration — GOOGLE_BUSINESS', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    getFreshGoogleBusinessAccessTokenMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Regression test for the production 401: the previous implementation
  // read the raw stored accessToken via getIntegrationCredential and
  // sent it as-is, with no expiry check — any test run after the token's
  // ~1 hour lifetime returned 401 UNAUTHENTICATED regardless of whether
  // the underlying refresh token was fine. This proves the fix actually
  // goes through the refresh-aware helper (the same one google-api.ts's
  // Reviews path already used correctly) instead of bypassing it.
  it('goes through the refresh-aware token helper, not a raw stored access token', async () => {
    getFreshGoogleBusinessAccessTokenMock.mockResolvedValue({ ok: true, accessToken: 'freshly-refreshed-token', locationId: 'locations/456' });
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ name: 'locations/456' }), { status: 200 }));

    const result = await testIntegration('GOOGLE_BUSINESS', 'egypt');

    expect(result.ok).toBe(true);
    expect(getFreshGoogleBusinessAccessTokenMock).toHaveBeenCalledWith('egypt');
    const [, init] = fetchMock.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer freshly-refreshed-token' });
  });

  it('surfaces a refresh failure honestly instead of attempting the API call with a bad token', async () => {
    getFreshGoogleBusinessAccessTokenMock.mockResolvedValue({
      ok: false,
      reason: 'REFRESH_FAILED',
      error: 'Google token refresh failed — reconnect Google Business Profile from Settings → Integrations.',
    });

    const result = await testIntegration('GOOGLE_BUSINESS', 'egypt');

    expect(result.ok).toBe(false);
    expect(result.status).toBeUndefined(); // a real failure, not PENDING
    expect(fetchMock).not.toHaveBeenCalled(); // never attempts the API call on a bad token
  });

  it('works identically for a different office (shared, not Egypt-specific)', async () => {
    getFreshGoogleBusinessAccessTokenMock.mockResolvedValue({ ok: true, accessToken: 'kuwait-token', locationId: 'locations/789' });
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ name: 'locations/789' }), { status: 200 }));

    await testIntegration('GOOGLE_BUSINESS', 'kuwait');

    expect(getFreshGoogleBusinessAccessTokenMock).toHaveBeenCalledWith('kuwait');
  });

  it('classifies a zero-quota 429 as PENDING, not a plain ERROR — OAuth is not confused with API availability', async () => {
    getFreshGoogleBusinessAccessTokenMock.mockResolvedValue({ ok: true, accessToken: 'valid-token', locationId: 'locations/456' });
    fetchMock.mockResolvedValue(new Response(quotaZeroBody(), { status: 429 }));

    const result = await testIntegration('GOOGLE_BUSINESS', 'egypt');

    expect(result.ok).toBe(false);
    expect(result.status).toBe('PENDING');
    expect(result.error).toMatch(/authenticated/i);
    expect(result.error).toMatch(/not.*approved|quota/i);
    // No infinite retry: exactly one call to the underlying fetch (the
    // shared retry wrapper fails fast on a zero-quota body).
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('classifies a genuine 401 from Google as a plain ERROR, never as PENDING — item 9', async () => {
    getFreshGoogleBusinessAccessTokenMock.mockResolvedValue({ ok: true, accessToken: 'valid-but-rejected-token', locationId: 'locations/456' });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 401, message: 'Request had invalid authentication credentials.', status: 'UNAUTHENTICATED' } }), {
        status: 401,
      })
    );

    const result = await testIntegration('GOOGLE_BUSINESS', 'egypt');

    expect(result.ok).toBe(false);
    expect(result.status).toBeUndefined();
    // Never retried — a 401 isn't a 429, so the shared retry wrapper
    // doesn't touch it either.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports ok:true when the API call actually succeeds', async () => {
    getFreshGoogleBusinessAccessTokenMock.mockResolvedValue({ ok: true, accessToken: 'valid-token', locationId: 'locations/456' });
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ name: 'locations/456', title: 'AHW Architects Masr' }), { status: 200 }));

    const result = await testIntegration('GOOGLE_BUSINESS', 'egypt');

    expect(result.ok).toBe(true);
    expect(result.status).toBeUndefined();
  });
});
