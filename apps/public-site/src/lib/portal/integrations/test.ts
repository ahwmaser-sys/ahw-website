import type { IntegrationType } from '@prisma/client';
import { getIntegrationCredential } from './store';
import { getGoogleAccessToken, type GoogleServiceAccountKey } from './google-service-account';
import { FROM as EMAIL_FROM } from '../email';
import * as googleAds from '../ads/google-ads';
import * as metaAds from '../ads/meta-ads';
import * as linkedInAds from '../ads/linkedin-ads';
import * as tiktokAds from '../ads/tiktok-ads';
import { AdPlatformApiError } from '../ads/types';

export interface TestResult {
  ok: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

// One real, live, read-only API call per integration type — never a
// simulated/fabricated "Connected." A stored credential that no longer
// works (revoked token, expired key) surfaces here as a real failure,
// not a stale green badge. Each call is the cheapest read-only endpoint
// that platform offers for verifying a credential.
export async function testIntegration(type: IntegrationType, officeId?: string | null): Promise<TestResult> {
  switch (type) {
    case 'INSTAGRAM': {
      const cred = await getIntegrationCredential<{ accessToken: string; businessAccountId: string }>(type, officeId);
      if (!cred) return { ok: false, error: 'Not connected.' };
      const res = await fetch(`https://graph.facebook.com/v21.0/${cred.businessAccountId}?fields=username&access_token=${cred.accessToken}`);
      if (!res.ok) return { ok: false, error: await res.text() };
      const body = (await res.json()) as { username?: string };
      return { ok: true, metadata: { username: body.username } };
    }
    case 'FACEBOOK': {
      const cred = await getIntegrationCredential<{ pageAccessToken: string; pageId: string }>(type, officeId);
      if (!cred) return { ok: false, error: 'Not connected.' };
      const res = await fetch(`https://graph.facebook.com/v21.0/${cred.pageId}?fields=name&access_token=${cred.pageAccessToken}`);
      if (!res.ok) return { ok: false, error: await res.text() };
      const body = (await res.json()) as { name?: string };
      return { ok: true, metadata: { pageName: body.name } };
    }
    case 'LINKEDIN': {
      const cred = await getIntegrationCredential<{ accessToken: string; organizationId?: string }>(type, officeId);
      if (!cred) return { ok: false, error: 'Not connected.' };
      if (!cred.organizationId) return { ok: false, error: 'Missing Organization ID — finish setup below.' };
      const res = await fetch(`https://api.linkedin.com/v2/organizations/${cred.organizationId}`, {
        headers: { Authorization: `Bearer ${cred.accessToken}` },
      });
      if (!res.ok) return { ok: false, error: await res.text() };
      return { ok: true };
    }
    case 'GOOGLE_BUSINESS': {
      const cred = await getIntegrationCredential<{ accessToken: string; locationId?: string }>(type, officeId);
      if (!cred) return { ok: false, error: 'Not connected.' };
      if (!cred.locationId) return { ok: false, error: 'Missing Location ID — finish setup below.' };
      // Business Information API (current), not the legacy My Business
      // API v4 — Google has been sunsetting v4 read endpoints in favor of
      // this one, so this is the check least likely to break out from
      // under a stored, working credential.
      //
      // cred.locationId is stored (and entered via the follow-up form) as
      // the full v4-style resource path "accounts/{account}/locations/{location}"
      // — that's what the publish adapter (google-business.ts, still on
      // v4) needs. This v1 API addresses a Location as a top-level
      // resource, "locations/{location}" with no account segment, so the
      // account prefix has to be stripped here or Google 404s the request
      // (confirmed: passing the full v4 path returns Google's generic
      // frontend 404 page, not a JSON API error).
      const locationOnly = cred.locationId.replace(/^accounts\/[^/]+\//, '');
      const res = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${locationOnly}?readMask=name,title`, {
        headers: { Authorization: `Bearer ${cred.accessToken}` },
      });
      if (!res.ok) return { ok: false, error: await res.text() };
      return { ok: true };
    }
    case 'GOOGLE_ANALYTICS': {
      const cred = await getIntegrationCredential<{ propertyId: string; serviceAccountKey: GoogleServiceAccountKey }>(type);
      if (!cred) return { ok: false, error: 'Not connected.' };
      const token = await getGoogleAccessToken(cred.serviceAccountKey, ['https://www.googleapis.com/auth/analytics.readonly']);
      const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${cred.propertyId}/metadata`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { ok: false, error: await res.text() };
      return { ok: true };
    }
    case 'GOOGLE_SEARCH_CONSOLE': {
      const cred = await getIntegrationCredential<{ siteUrl: string; serviceAccountKey: GoogleServiceAccountKey }>(type);
      if (!cred) return { ok: false, error: 'Not connected.' };
      const token = await getGoogleAccessToken(cred.serviceAccountKey, ['https://www.googleapis.com/auth/webmasters.readonly']);
      const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(cred.siteUrl)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { ok: false, error: await res.text() };
      return { ok: true };
    }
    case 'GOOGLE_MAPS': {
      const cred = await getIntegrationCredential<{ apiKey: string }>(type);
      if (!cred) return { ok: false, error: 'Not connected.' };
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Cairo&key=${cred.apiKey}`);
      const body = (await res.json()) as { status?: string; error_message?: string };
      if (body.status !== 'OK') return { ok: false, error: body.error_message ?? body.status ?? 'Unknown error.' };
      return { ok: true };
    }
    case 'SMTP_EMAIL': {
      const cred = await getIntegrationCredential<{ apiKey: string }>(type);
      if (!cred) return { ok: false, error: 'Not connected.' };
      // The one deliberate exception to this file's "read-only call" rule
      // above: a Resend key scoped to Sending access (the least-privilege
      // choice, and all this integration ever needs — see email.ts) is
      // rejected by every other Resend endpoint, including GET /domains.
      // Sending a real, minimal email to our own verified sender address
      // is the only way to confirm a sending-only key actually works.
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cred.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: EMAIL_FROM.match(/<(.+)>/)?.[1] ?? EMAIL_FROM,
          subject: 'AHW Architects Portal — connection test',
          text: 'This is an automated connection test triggered from Settings → Integrations. No action needed.',
        }),
      });
      if (!res.ok) return { ok: false, error: await res.text() };
      return { ok: true };
    }
    case 'AI_ANTHROPIC': {
      const cred = await getIntegrationCredential<{ apiKey: string }>(type);
      if (!cred) return { ok: false, error: 'Not connected.' };
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': cred.apiKey, 'anthropic-version': '2023-06-01' },
      });
      if (!res.ok) return { ok: false, error: await res.text() };
      return { ok: true };
    }
    case 'AI_OPENAI': {
      const cred = await getIntegrationCredential<{ apiKey: string }>(type);
      if (!cred) return { ok: false, error: 'Not connected.' };
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${cred.apiKey}` },
      });
      if (!res.ok) return { ok: false, error: await res.text() };
      return { ok: true };
    }
    case 'AI_GEMINI': {
      const cred = await getIntegrationCredential<{ apiKey: string }>(type);
      if (!cred) return { ok: false, error: 'Not connected.' };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cred.apiKey}`);
      if (!res.ok) return { ok: false, error: await res.text() };
      return { ok: true };
    }
    case 'AI_OPENROUTER': {
      const cred = await getIntegrationCredential<{ apiKey: string }>(type);
      if (!cred) return { ok: false, error: 'Not connected.' };
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${cred.apiKey}` },
      });
      if (!res.ok) return { ok: false, error: await res.text() };
      return { ok: true };
    }
    // ── Marketing Ads Control Center — company-wide, officeId always null ──
    case 'GOOGLE_ADS': {
      const cred = await getIntegrationCredential<googleAds.GoogleAdsCredential>(type);
      if (!cred) return { ok: false, error: 'Not connected.' };
      try {
        const result = await googleAds.testConnection(cred);
        return { ok: true, metadata: { customerId: result.customerId, descriptiveName: result.descriptiveName } };
      } catch (error) {
        return { ok: false, error: error instanceof AdPlatformApiError ? error.message : 'Test failed.' };
      }
    }
    case 'META_ADS': {
      const cred = await getIntegrationCredential<metaAds.MetaAdsCredential>(type);
      if (!cred) return { ok: false, error: 'Not connected.' };
      try {
        const result = await metaAds.testConnection(cred);
        return { ok: true, metadata: { adAccountName: result.adAccountName } };
      } catch (error) {
        return { ok: false, error: error instanceof AdPlatformApiError ? error.message : 'Test failed.' };
      }
    }
    case 'LINKEDIN_ADS': {
      const cred = await getIntegrationCredential<linkedInAds.LinkedInAdsCredential>(type);
      if (!cred) return { ok: false, error: 'Not connected.' };
      try {
        const result = await linkedInAds.testConnection(cred);
        return { ok: true, metadata: { adAccountName: result.adAccountName } };
      } catch (error) {
        return { ok: false, error: error instanceof AdPlatformApiError ? error.message : 'Test failed.' };
      }
    }
    case 'TIKTOK_ADS': {
      const cred = await getIntegrationCredential<tiktokAds.TikTokAdsCredential>(type);
      if (!cred) return { ok: false, error: 'Not connected.' };
      try {
        const result = await tiktokAds.testConnection(cred);
        return { ok: true, metadata: { advertiserName: result.advertiserName } };
      } catch (error) {
        return { ok: false, error: error instanceof AdPlatformApiError ? error.message : 'Test failed.' };
      }
    }
  }
}
