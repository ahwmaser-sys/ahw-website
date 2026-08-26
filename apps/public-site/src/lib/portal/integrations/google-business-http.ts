// Shared, retry-aware HTTP layer for every Google Business Profile API
// call in this codebase — Reviews' v4 List (google-api.ts), Business
// Information v1 (test.ts's GOOGLE_BUSINESS check), Account Management
// v1 + Business Information v1 (oauth.ts's location discovery), and the
// v4 localPosts publish adapter (social/google-business.ts). This is the
// one place request backoff and the zero-quota classification live, so
// every caller — Egypt, Kuwait, or any future office — behaves
// identically instead of four copies of the same logic drifting apart.
//
// None of these call sites currently run concurrently or in a loop that
// fans out multiple requests at once (each is a single on-demand call
// triggered by one admin button click, or a strictly sequential
// pagination loop) — this module doesn't invent throttling for a burst
// that doesn't exist in the code today. What it does add: correct,
// bounded handling for a GENUINE transient 429 (real per-minute
// throttling, which becomes possible the moment Google grants this
// project real quota), without ever retrying a permanent zero-quota
// block.

export interface GbpFetchOptions {
  /** Bounded — this function always returns, never retries forever. */
  maxRetries?: number;
}

const DEFAULT_MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 1000;
const MAX_JITTER_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Google's quota-exceeded error body carries an ErrorInfo detail with
// metadata.quota_limit_value — "0" specifically means the Cloud
// project's Business Profile API access hasn't been approved yet (this
// project's exact, current, real state — Case 0-7592000041310, pending
// as of this writing). A generic 429 with a nonzero/absent
// quota_limit_value is real throttling instead, and is worth retrying.
export function isGoogleBusinessQuotaPendingBody(bodyText: string): boolean {
  return bodyText.includes('quota_limit_value') && /"quota_limit_value"\s*:\s*"0"/.test(bodyText);
}

function parseRetryAfterMs(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const dateMs = Date.parse(header);
  return Number.isNaN(dateMs) ? null : Math.max(0, dateMs - Date.now());
}

// Retries a genuine, transient 429 with exponential backoff + jitter,
// honoring Retry-After when Google sends one. Never retries a
// zero-quota (access-not-yet-approved) 429 — that's a permanent block
// until Google manually approves it; hammering it wastes calls with no
// chance of succeeding, which is exactly what NOT to do while a
// approval request is pending. Bounded by maxRetries either way.
export async function fetchGoogleBusinessApi(url: string, init: RequestInit, options: GbpFetchOptions = {}): Promise<Response> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429) return res;

    const bodyText = await res.clone().text();
    if (isGoogleBusinessQuotaPendingBody(bodyText)) return res; // permanent — fail fast
    if (attempt >= maxRetries) return res; // retries exhausted

    const retryAfterMs = parseRetryAfterMs(res.headers.get('Retry-After'));
    const backoffMs = retryAfterMs ?? BASE_BACKOFF_MS * 2 ** attempt;
    const jitterMs = Math.random() * MAX_JITTER_MS;
    // No token/credential/header is ever included in this log line —
    // only the attempt count and delay.
    console.warn(`[google-business] 429 on attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${Math.round(backoffMs + jitterMs)}ms`);
    await sleep(backoffMs + jitterMs);
  }
}
