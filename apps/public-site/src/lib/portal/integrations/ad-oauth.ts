import { randomBytes } from 'crypto';

// OAuth for the Marketing Ads Control Center's four ad platforms. Kept as
// its own module rather than folded into oauth.ts: every type here is
// company-wide (officeId always null) — one Google Ads / Meta Ads /
// LinkedIn Ads account and one TikTok Business account serve every
// market — whereas oauth.ts's four types are always per-office. The
// app-level client id/secret are one-time infrastructure setup (same
// category as SESSION_SECRET), kept in env, never entered through the
// UI. Google Ads and Meta Ads deliberately reuse the SAME app-level
// client id/secret as GOOGLE_BUSINESS/FACEBOOK/INSTAGRAM above — they're
// the same Google Cloud OAuth client / Meta Developer app, just consented
// with additional ads scopes — so connecting Google Ads or Meta Ads does
// NOT require registering a second OAuth app with either platform.
// LinkedIn Ads reuses the LinkedIn app the same way. TikTok has no
// existing OAuth app in this codebase, so it gets its own env pair.

export type AdOAuthType = 'GOOGLE_ADS' | 'META_ADS' | 'LINKEDIN_ADS' | 'TIKTOK_ADS';

export const AD_OAUTH_TYPES: readonly AdOAuthType[] = ['GOOGLE_ADS', 'META_ADS', 'LINKEDIN_ADS', 'TIKTOK_ADS'];

function redirectUri(type: AdOAuthType): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3005';
  return `${base}/api/portal/integrations/oauth/${type}/callback`;
}

export function isAdOAuthAppConfigured(type: AdOAuthType): boolean {
  switch (type) {
    case 'GOOGLE_ADS':
      // The developer token (issued by a Google Ads manager account, not
      // an OAuth credential) is required for every real API call this
      // integration makes — without it the OAuth connection would
      // "succeed" but every subsequent Google Ads API request would 401,
      // so it's treated as part of "is this app configured at all."
      return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_ADS_DEVELOPER_TOKEN);
    case 'META_ADS':
      return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
    case 'LINKEDIN_ADS':
      return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
    case 'TIKTOK_ADS':
      return Boolean(process.env.TIKTOK_APP_ID && process.env.TIKTOK_APP_SECRET);
  }
}

export function buildAdAuthUrl(type: AdOAuthType, state: string): string {
  const redirect = redirectUri(type);
  switch (type) {
    case 'GOOGLE_ADS': {
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        redirect_uri: redirect,
        state,
        scope: 'https://www.googleapis.com/auth/adwords',
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
    case 'META_ADS': {
      const params = new URLSearchParams({
        client_id: process.env.META_APP_ID ?? '',
        redirect_uri: redirect,
        state,
        scope: 'ads_management,ads_read,business_management',
        response_type: 'code',
      });
      return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
    }
    case 'LINKEDIN_ADS': {
      const params = new URLSearchParams({
        client_id: process.env.LINKEDIN_CLIENT_ID ?? '',
        redirect_uri: redirect,
        state,
        // LinkedIn Marketing Developer Platform scopes — only granted to
        // apps approved into that program (see the manual's LinkedIn
        // section). Requesting them on an unapproved app fails the
        // consent screen with LinkedIn's own error, not a silent success.
        scope: 'r_ads r_ads_reporting rw_ads',
        response_type: 'code',
      });
      return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    }
    case 'TIKTOK_ADS': {
      const params = new URLSearchParams({
        app_id: process.env.TIKTOK_APP_ID ?? '',
        redirect_uri: redirect,
        state,
        rid: state,
      });
      return `https://business-api.tiktok.com/portal/auth?${params.toString()}`;
    }
  }
}

export function generateAdOAuthState(): string {
  return randomBytes(16).toString('hex');
}

// Result shape varies by platform, matching each ads/*.ts client's own
// Credential interface.
export async function exchangeAdCode(type: AdOAuthType, code: string): Promise<Record<string, unknown>> {
  const redirect = redirectUri(type);

  if (type === 'GOOGLE_ADS') {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirect,
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      }),
    });
    if (!tokenRes.ok) throw new Error(`Google Ads token exchange failed: ${await tokenRes.text()}`);
    const tokenBody = (await tokenRes.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
    if (!tokenBody.refresh_token) {
      throw new Error(
        'Google did not return a refresh token — this Google account may have already granted this app access once before. Revoke access at myaccount.google.com/permissions and reconnect.'
      );
    }
    return {
      accessToken: tokenBody.access_token,
      refreshToken: tokenBody.refresh_token,
      ...(tokenBody.expires_in ? { accessTokenExpiresAt: new Date(Date.now() + tokenBody.expires_in * 1000).toISOString() } : {}),
    };
  }

  if (type === 'META_ADS') {
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${new URLSearchParams({
        client_id: process.env.META_APP_ID ?? '',
        client_secret: process.env.META_APP_SECRET ?? '',
        redirect_uri: redirect,
        code,
      }).toString()}`
    );
    if (!tokenRes.ok) throw new Error(`Meta Ads token exchange failed: ${await tokenRes.text()}`);
    const tokenBody = (await tokenRes.json()) as { access_token: string };
    // Ad account id is never derivable from the token alone (one login
    // can have access to many ad accounts) — collected via the
    // Integrations page's follow-up form, same shape as LinkedIn's
    // organizationId follow-up in oauth.ts.
    return { accessToken: tokenBody.access_token };
  }

  if (type === 'LINKEDIN_ADS') {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirect,
        client_id: process.env.LINKEDIN_CLIENT_ID ?? '',
        client_secret: process.env.LINKEDIN_CLIENT_SECRET ?? '',
      }),
    });
    if (!tokenRes.ok) throw new Error(`LinkedIn Ads token exchange failed: ${await tokenRes.text()}`);
    const tokenBody = (await tokenRes.json()) as { access_token: string };
    return { accessToken: tokenBody.access_token };
  }

  // TIKTOK_ADS — token exchange uses a JSON body keyed by app_id/secret/
  // auth_code (not the redirect_uri/grant_type shape the other three
  // platforms use), per TikTok Business API's own documented contract.
  const tokenRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.TIKTOK_APP_ID ?? '',
      secret: process.env.TIKTOK_APP_SECRET ?? '',
      auth_code: code,
    }),
  });
  if (!tokenRes.ok) throw new Error(`TikTok Ads token exchange failed: ${await tokenRes.text()}`);
  const tokenBody = (await tokenRes.json()) as { code: number; message: string; data?: { access_token: string; advertiser_ids?: string[] } };
  if (tokenBody.code !== 0 || !tokenBody.data) throw new Error(`TikTok Ads token exchange failed: ${tokenBody.message}`);
  return { accessToken: tokenBody.data.access_token, advertiserIds: tokenBody.data.advertiser_ids ?? [] };
}

// Which platforms come back from exchangeAdCode() without every field a
// client.ts needs to actually call the API (ad account / customer /
// advertiser id) — those always need the Integrations page's manual
// follow-up form, the same pattern oauth.ts's needsFollowUp() already
// establishes for LinkedIn/Google Business.
export function adNeedsFollowUp(type: AdOAuthType, result: Record<string, unknown>): boolean {
  if (type === 'GOOGLE_ADS') return true; // customer id is never derivable from the token alone
  if (type === 'META_ADS') return true; // ad account id ditto
  if (type === 'LINKEDIN_ADS') return true; // ad account (sponsored account) id ditto
  if (type === 'TIKTOK_ADS') return !((result.advertiserIds as string[] | undefined)?.length);
  return false;
}
