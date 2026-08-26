import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchGoogleBusinessApi, isGoogleBusinessQuotaPendingBody } from './google-business-http';

function quotaZeroBody() {
  return JSON.stringify({
    error: {
      code: 429,
      status: 'RESOURCE_EXHAUSTED',
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

function realThrottleBody() {
  return JSON.stringify({
    error: {
      code: 429,
      status: 'RESOURCE_EXHAUSTED',
      details: [
        {
          '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
          reason: 'RATE_LIMIT_EXCEEDED',
          metadata: { quota_limit_value: '600' },
        },
      ],
    },
  });
}

describe('isGoogleBusinessQuotaPendingBody', () => {
  it('recognizes a zero-quota (access not yet approved) body', () => {
    expect(isGoogleBusinessQuotaPendingBody(quotaZeroBody())).toBe(true);
  });

  it('does not treat a real, nonzero-quota throttle body as quota-pending', () => {
    expect(isGoogleBusinessQuotaPendingBody(realThrottleBody())).toBe(false);
  });

  it('does not false-positive on unrelated error bodies', () => {
    expect(isGoogleBusinessQuotaPendingBody(JSON.stringify({ error: { code: 401 } }))).toBe(false);
  });
});

describe('fetchGoogleBusinessApi', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns immediately (no retry) on a genuine 429 with zero quota — item 10: no infinite retry on a permanent block', async () => {
    fetchMock.mockResolvedValue(new Response(quotaZeroBody(), { status: 429 }));

    const promise = fetchGoogleBusinessApi('https://mybusinessbusinessinformation.googleapis.com/v1/x', {});
    const res = await promise;

    expect(res.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1); // no retry attempted at all
  });

  it('retries a real transient 429 with backoff, then succeeds — item 3', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(realThrottleBody(), { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const promise = fetchGoogleBusinessApi('https://example.googleapis.com/v1/x', {});
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('respects Retry-After when Google supplies it — item 4', async () => {
    const headers = new Headers({ 'Retry-After': '3' });
    fetchMock
      .mockResolvedValueOnce(new Response(realThrottleBody(), { status: 429, headers }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const promise = fetchGoogleBusinessApi('https://example.googleapis.com/v1/x', {});
    // Should not resolve before ~3s of fake time has advanced.
    let settled = false;
    void promise.then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(2000);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1500);
    const res = await promise;
    expect(res.status).toBe(200);
  });

  it('is bounded — stops retrying after maxRetries and returns the last failure, never loops forever — item 5', async () => {
    fetchMock.mockResolvedValue(new Response(realThrottleBody(), { status: 429 }));

    const promise = fetchGoogleBusinessApi('https://example.googleapis.com/v1/x', {}, { maxRetries: 2 });
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 initial + 2 retries, then stop
  });

  it('passes non-429 responses straight through with no retry', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }));
    const res = await fetchGoogleBusinessApi('https://example.googleapis.com/v1/x', {});
    expect(res.status).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
