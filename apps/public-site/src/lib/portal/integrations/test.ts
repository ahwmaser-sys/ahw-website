import type { IntegrationType } from '@prisma/client';
import { getIntegrationCredential } from './store';
import { getGoogleAccessToken, type GoogleServiceAccountKey } from './google-service-account';

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
      const res = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${cred.locationId}?readMask=name,title`, {
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
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${cred.apiKey}` },
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
  }
}
