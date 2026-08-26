import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { getIntegrationCredentialMock } = vi.hoisted(() => ({ getIntegrationCredentialMock: vi.fn() }));
vi.mock('./store', () => ({ getIntegrationCredential: getIntegrationCredentialMock }));

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

// Item 10: a zero-quota/API-access error is reported honestly and does
// not create an infinite retry loop. Also covers the "AUTHENTICATED vs
// API ACCESS AVAILABLE" distinction the fix introduces for the generic
// Settings → Integrations Test Connection path.
describe('testIntegration — GOOGLE_BUSINESS quota-pending classification', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    getIntegrationCredentialMock.mockResolvedValue({
      accessToken: 'fake-access-token',
      locationId: 'accounts/123/locations/456',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('classifies a zero-quota 429 as PENDING, not a plain ERROR — OAuth is not confused with API availability', async () => {
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

  it('classifies a real 4xx (revoked credential) as a plain ERROR, not PENDING', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { code: 401, message: 'invalid_token' } }), { status: 401 }));

    const result = await testIntegration('GOOGLE_BUSINESS', 'egypt');

    expect(result.ok).toBe(false);
    expect(result.status).toBeUndefined();
  });

  it('reports ok:true when the API call actually succeeds', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ name: 'locations/456', title: 'AHW Architects Masr' }), { status: 200 }));

    const result = await testIntegration('GOOGLE_BUSINESS', 'egypt');

    expect(result.ok).toBe(true);
    expect(result.status).toBeUndefined();
  });
});
