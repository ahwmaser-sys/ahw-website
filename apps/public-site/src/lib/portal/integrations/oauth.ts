import { randomBytes } from 'crypto';
import type { IntegrationType } from '@prisma/client';

// OAuth for the platforms that support it (Instagram/Facebook share one
// Meta app; LinkedIn and Google Business Profile each have their own).
// The app-level client id/secret below are a one-time infrastructure
// setup (the owner registers a developer app with each platform) — kept
// in env exactly like SESSION_SECRET, never entered through the UI. What
// IS UI-driven is everything after that: starting the consent flow,
// receiving the callback, and storing the resulting user token via
// connectIntegration() — no .env edit needed to connect, reconnect, or
// disconnect an actual account.
//
// Google Analytics and Search Console deliberately do NOT use this
// module — both APIs' own documented pattern for server-side reporting
// access is a service-account credential granted Viewer access on the
// property/site (see google-service-account.ts), not a redirect flow
// tied to one person's Google login. Google Business Profile does need
// end-user OAuth (posts are attributed to whoever connects it), so it's
// the one Google integration handled here.

export type OAuthIntegration = 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'GOOGLE_BUSINESS';

function redirectUri(type: OAuthIntegration): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3005';
  return `${base}/api/portal/integrations/oauth/${type}/callback`;
}

export function isOAuthAppConfigured(type: OAuthIntegration): boolean {
  switch (type) {
    case 'INSTAGRAM':
    case 'FACEBOOK':
      return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
    case 'LINKEDIN':
      return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
    case 'GOOGLE_BUSINESS':
      return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }
}

export function buildAuthUrl(type: OAuthIntegration, state: string): string {
  const redirect = redirectUri(type);
  switch (type) {
    case 'INSTAGRAM':
    case 'FACEBOOK': {
      const scope = type === 'INSTAGRAM' ? 'instagram_basic,instagram_content_publish,pages_show_list' : 'pages_manage_posts,pages_read_engagement,pages_show_list';
      const params = new URLSearchParams({
        client_id: process.env.META_APP_ID ?? '',
        redirect_uri: redirect,
        state,
        scope,
        response_type: 'code',
      });
      return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
    }
    case 'LINKEDIN': {
      const params = new URLSearchParams({
        client_id: process.env.LINKEDIN_CLIENT_ID ?? '',
        redirect_uri: redirect,
        state,
        scope: 'w_organization_social r_organization_social',
        response_type: 'code',
      });
      return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    }
    case 'GOOGLE_BUSINESS': {
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        redirect_uri: redirect,
        state,
        scope: 'https://www.googleapis.com/auth/business.manage',
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
  }
}

export function generateOAuthState(): string {
  return randomBytes(16).toString('hex');
}

// Result shape varies by platform (each needs different follow-up calls
// to reach a usable credential) — callers store whatever comes back
// under the shape each social adapter already expects (see
// social/*.ts's own Credential interfaces).
export async function exchangeCode(type: OAuthIntegration, code: string): Promise<Record<string, unknown>> {
  const redirect = redirectUri(type);

  if (type === 'INSTAGRAM' || type === 'FACEBOOK') {
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${new URLSearchParams({
        client_id: process.env.META_APP_ID ?? '',
        client_secret: process.env.META_APP_SECRET ?? '',
        redirect_uri: redirect,
        code,
      }).toString()}`
    );
    if (!tokenRes.ok) throw new Error(`Meta token exchange failed: ${await tokenRes.text()}`);
    const tokenBody = (await tokenRes.json()) as { access_token: string };

    // A page/business token is what's actually needed to post — the
    // user token above is only the intermediate step.
    const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${tokenBody.access_token}`);
    if (!pagesRes.ok) throw new Error(`Meta pages lookup failed: ${await pagesRes.text()}`);
    const pagesBody = (await pagesRes.json()) as { data: { id: string; access_token: string; name: string }[] };
    const page = pagesBody.data[0];
    if (!page) throw new Error('No Facebook Page found for this account — Instagram/Facebook publishing requires a connected Page.');

    if (type === 'FACEBOOK') {
      return { pageAccessToken: page.access_token, pageId: page.id, pageName: page.name };
    }

    const igRes = await fetch(`https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
    if (!igRes.ok) throw new Error(`Instagram business account lookup failed: ${await igRes.text()}`);
    const igBody = (await igRes.json()) as { instagram_business_account?: { id: string } };
    if (!igBody.instagram_business_account) {
      throw new Error('This Facebook Page has no linked Instagram Business account.');
    }
    return { accessToken: page.access_token, businessAccountId: igBody.instagram_business_account.id, pageName: page.name };
  }

  if (type === 'LINKEDIN') {
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
    if (!tokenRes.ok) throw new Error(`LinkedIn token exchange failed: ${await tokenRes.text()}`);
    const tokenBody = (await tokenRes.json()) as { access_token: string };
    // organizationId isn't derivable from this token alone without extra
    // partner-level permissions — collected from the admin via the
    // Integrations UI's "Organization ID" field alongside this token.
    return { accessToken: tokenBody.access_token };
  }

  // GOOGLE_BUSINESS
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
  if (!tokenRes.ok) throw new Error(`Google token exchange failed: ${await tokenRes.text()}`);
  const tokenBody = (await tokenRes.json()) as { access_token: string; refresh_token?: string };
  // Best-effort auto-discovery of the connected account's Location ID —
  // only fills it in when exactly one location is unambiguous. Requires
  // the Business Profile APIs to be enabled AND quota-approved on the
  // Google Cloud project (Settings → Integrations docs); until then this
  // 403s/429s and silently returns null, which is fine — the caller
  // falls back to the manual "Location ID" follow-up form exactly like
  // it does today.
  const locationId = await discoverGoogleBusinessLocationId(tokenBody.access_token);
  return {
    accessToken: tokenBody.access_token,
    refreshToken: tokenBody.refresh_token,
    ...(locationId ? { locationId } : {}),
  };
}

async function discoverGoogleBusinessLocationId(accessToken: string): Promise<string | null> {
  try {
    const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!accountsRes.ok) return null;
    const accountsBody = (await accountsRes.json()) as { accounts?: { name: string }[] };

    const locationNames: string[] = [];
    for (const account of accountsBody.accounts ?? []) {
      const locationsRes = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!locationsRes.ok) continue;
      const locationsBody = (await locationsRes.json()) as { locations?: { name: string }[] };
      for (const location of locationsBody.locations ?? []) {
        locationNames.push(location.name); // "accounts/{account}/locations/{location}"
      }
    }

    // Multiple locations on one Google login (e.g. one person managing
    // both the Egypt and Kuwait profiles) is ambiguous — don't guess
    // which office this connection belongs to, leave it to the manual
    // form instead.
    return locationNames.length === 1 ? (locationNames[0] ?? null) : null;
  } catch {
    return null;
  }
}

export function integrationTypeToOAuth(type: IntegrationType): OAuthIntegration | null {
  if (type === 'INSTAGRAM' || type === 'FACEBOOK' || type === 'LINKEDIN' || type === 'GOOGLE_BUSINESS') return type;
  return null;
}
