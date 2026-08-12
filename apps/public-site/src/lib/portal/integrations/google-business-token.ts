import { getIntegrationCredential, refreshIntegrationCredential } from './store';

// Shared by every reader of the GOOGLE_BUSINESS credential that needs a
// currently-valid access token (today: Reviews sync/test-connection, see
// lib/portal/reviews/google-api.ts). On-demand refresh only, triggered by
// an actual server action — never a background job/timer. This keeps
// IntegrationConfig.lastTokenRefreshAt's existing schema comment ("no
// automatic background refresh exists") accurate: this refreshes lazily,
// at call time, not on a schedule.
export interface GoogleBusinessCredential {
  accessToken: string;
  refreshToken?: string;
  locationId?: string; // "accounts/{account}/locations/{location}"
  accessTokenExpiresAt?: string; // ISO 8601, set at connect/refresh time
}

const REFRESH_SKEW_MS = 5 * 60 * 1000;

export type GoogleBusinessTokenResult =
  | { ok: true; accessToken: string; locationId: string }
  | { ok: false; error: string; reason: 'NOT_CONNECTED' | 'MISSING_LOCATION' | 'REFRESH_FAILED' };

async function refreshAccessToken(officeId: string, cred: GoogleBusinessCredential): Promise<GoogleBusinessTokenResult> {
  if (!cred.refreshToken || !cred.locationId) {
    return {
      ok: false,
      reason: 'REFRESH_FAILED',
      error: 'No refresh token stored for this connection — reconnect Google Business Profile from Settings → Integrations to get one (Google only issues refresh tokens on a fresh consent screen).',
    };
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: cred.refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  });
  if (!res.ok) {
    // Refresh token itself revoked/invalid — no amount of retrying fixes
    // this; the only real fix is reconnecting via OAuth. Body text only,
    // never logged with the refresh token that produced it.
    return { ok: false, reason: 'REFRESH_FAILED', error: 'Google token refresh failed — reconnect Google Business Profile from Settings → Integrations.' };
  }
  const body = (await res.json()) as { access_token: string; expires_in?: number };
  const updated: GoogleBusinessCredential = {
    ...cred,
    accessToken: body.access_token,
    ...(body.expires_in ? { accessTokenExpiresAt: new Date(Date.now() + body.expires_in * 1000).toISOString() } : {}),
  };
  await refreshIntegrationCredential('GOOGLE_BUSINESS', officeId, updated);
  return { ok: true, accessToken: updated.accessToken, locationId: cred.locationId };
}

// `force: true` bypasses the cached-expiry check — used exactly once, by
// the Reviews API caller, when a request comes back 401 despite the
// cached expiry saying the token should still be good (clock skew, or an
// older connection made before accessTokenExpiresAt was recorded).
export async function getFreshGoogleBusinessAccessToken(officeId: string, options: { force?: boolean } = {}): Promise<GoogleBusinessTokenResult> {
  const cred = await getIntegrationCredential<GoogleBusinessCredential>('GOOGLE_BUSINESS', officeId);
  if (!cred?.accessToken) {
    return { ok: false, reason: 'NOT_CONNECTED', error: 'Google Business Profile is not connected for this office — connect it from Settings → Integrations.' };
  }
  if (!cred.locationId) {
    return { ok: false, reason: 'MISSING_LOCATION', error: 'Google Business Profile is connected but missing a Location ID — finish setup in Settings → Integrations.' };
  }

  const expiresAtMs = cred.accessTokenExpiresAt ? Date.parse(cred.accessTokenExpiresAt) : NaN;
  const needsRefresh = options.force || (!Number.isNaN(expiresAtMs) && Date.now() >= expiresAtMs - REFRESH_SKEW_MS);

  if (!needsRefresh) {
    return { ok: true, accessToken: cred.accessToken, locationId: cred.locationId };
  }
  return refreshAccessToken(officeId, cred);
}
