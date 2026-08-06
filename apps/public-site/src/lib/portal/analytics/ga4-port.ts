import type { AnalyticsPort, TrafficSummary, KeywordMetric } from '@agp/application';
import { getIntegrationCredential } from '../integrations/store';
import { getGoogleAccessToken, type GoogleServiceAccountKey } from '../integrations/google-service-account';

// GA4 Data API + Search Console — genuinely absent until the owner
// connects them from Settings → Integrations (NEXT_PUBLIC_GA_MEASUREMENT_ID
// sends events *to* GA4, it does not grant this app permission to read
// data back *out*, which needs a separate service-account credential).
// isConfigured() honestly reflects the connected state; the dashboard
// shows a "Connect Google Analytics" link instead of ever calling these
// methods speculatively.

interface GA4Credential {
  propertyId: string;
  serviceAccountKey: GoogleServiceAccountKey;
}

interface SearchConsoleCredential {
  siteUrl: string;
  serviceAccountKey: GoogleServiceAccountKey;
}

async function isTrafficConfigured(): Promise<boolean> {
  const cred = await getIntegrationCredential<GA4Credential>('GOOGLE_ANALYTICS');
  return Boolean(cred?.propertyId && cred.serviceAccountKey);
}

async function isKeywordsConfigured(): Promise<boolean> {
  const cred = await getIntegrationCredential<SearchConsoleCredential>('GOOGLE_SEARCH_CONSOLE');
  return Boolean(cred?.siteUrl && cred.serviceAccountKey);
}

export const ga4AnalyticsProvider: AnalyticsPort = {
  async isConfigured(): Promise<boolean> {
    return (await isTrafficConfigured()) || (await isKeywordsConfigured());
  },

  async getTrafficSummary(rangeStart: string, rangeEnd: string): Promise<TrafficSummary> {
    const cred = await getIntegrationCredential<GA4Credential>('GOOGLE_ANALYTICS');
    if (!cred) {
      throw new Error('Google Analytics is not connected. Connect it from Settings → Integrations to enable organic traffic reporting.');
    }
    const token = await getGoogleAccessToken(cred.serviceAccountKey, ['https://www.googleapis.com/auth/analytics.readonly']);
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${cred.propertyId}:runReport`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        dateRanges: [{ startDate: rangeStart, endDate: rangeEnd }],
        metrics: [{ name: 'sessions' }],
        dimensionFilter: undefined,
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      }),
    });
    if (!res.ok) {
      throw new Error(`GA4 Data API request failed (${res.status}): ${await res.text()}`);
    }
    const body = (await res.json()) as { rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] };
    let sessions = 0;
    let organicSessions = 0;
    for (const row of body.rows ?? []) {
      const value = Number(row.metricValues[0]?.value ?? '0');
      sessions += value;
      if (row.dimensionValues[0]?.value === 'Organic Search') organicSessions += value;
    }

    return { sessions, organicSessions, rangeStart, rangeEnd };
  },

  async getTopKeywords(limit: number): Promise<readonly KeywordMetric[]> {
    const cred = await getIntegrationCredential<SearchConsoleCredential>('GOOGLE_SEARCH_CONSOLE');
    if (!cred) {
      throw new Error('Google Search Console is not connected. Connect it from Settings → Integrations to enable keyword reporting.');
    }
    const token = await getGoogleAccessToken(cred.serviceAccountKey, ['https://www.googleapis.com/auth/webmasters.readonly']);
    const end = new Date();
    const start = new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000);
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(cred.siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          dimensions: ['query'],
          rowLimit: limit,
        }),
      }
    );
    if (!res.ok) {
      throw new Error(`Search Console API request failed (${res.status}): ${await res.text()}`);
    }
    const body = (await res.json()) as { rows?: { keys: string[]; clicks: number; impressions: number; position: number }[] };
    return (body.rows ?? []).map((row) => ({
      keyword: row.keys[0] ?? '',
      clicks: row.clicks,
      impressions: row.impressions,
      averagePosition: row.position,
    }));
  },
};
