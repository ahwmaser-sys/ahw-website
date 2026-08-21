import { AdPlatformApiError, type AdCampaignSnapshot, type ConversionActionSnapshot } from './types';

// Google Ads API (REST, v25 — https://developers.google.com/google-ads/api/rest/overview).
// Plain fetch, same as every other integration in this codebase (no
// google-ads-api SDK dependency added). Every call needs three things:
// an OAuth access token (refreshed per-call below, since there is no
// background token-refresh worker in this app — see IntegrationConfig's
// own "no automatic background refresh exists" note), the account-level
// developer token (GOOGLE_ADS_DEVELOPER_TOKEN, a one-time manual-approval
// credential — see the manual), and the target Customer ID.
//
// The Google Ads API moved to monthly major-version releases in 2026 and
// retires each one roughly a year after release (v19 sunset 2026-02-11;
// v18, used when this file was first written, sunset before that). The
// GAQL fields queried below (campaign id/name/status/advertising_channel_type,
// metrics.*, conversion_action id/name/status/category) are long-standing,
// unaffected by v25's breaking changes (which only removed the legacy
// CustomerLifecycleGoal/CampaignLifecycleGoal resources) — bump API_BASE's
// version segment again well before this one's own sunset.

export interface GoogleAdsCredential {
  refreshToken: string;
  customerId?: string | undefined; // 10-digit Google Ads Customer ID, no dashes — collected via the Integrations follow-up form
  loginCustomerId?: string | undefined; // optional MCC manager account id, only needed if customerId is managed under one
}

const API_BASE = 'https://googleads.googleapis.com/v25';

async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  });
  if (!res.ok) throw new AdPlatformApiError('GOOGLE_ADS', `Access token refresh failed: ${await res.text()}`);
  const body = (await res.json()) as { access_token: string };
  return body.access_token;
}

function requireDeveloperToken(): string {
  const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!token) throw new AdPlatformApiError('GOOGLE_ADS', 'GOOGLE_ADS_DEVELOPER_TOKEN is not configured — see the Marketing Ads Control Center manual.');
  return token;
}

function requireCustomerId(credential: GoogleAdsCredential): string {
  if (!credential.customerId) throw new AdPlatformApiError('GOOGLE_ADS', 'Missing Google Ads Customer ID — finish setup on the Integrations page.');
  return credential.customerId.replace(/-/g, '');
}

async function gaqlSearch(credential: GoogleAdsCredential, query: string): Promise<Record<string, unknown>[]> {
  const customerId = requireCustomerId(credential);
  const accessToken = await getAccessToken(credential.refreshToken);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': requireDeveloperToken(),
    'Content-Type': 'application/json',
  };
  if (credential.loginCustomerId) headers['login-customer-id'] = credential.loginCustomerId.replace(/-/g, '');

  const results: Record<string, unknown>[] = [];
  let pageToken: string | undefined;
  do {
    const res = await fetch(`${API_BASE}/customers/${customerId}/googleAds:search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, pageToken, pageSize: 200 }),
    });
    if (!res.ok) throw new AdPlatformApiError('GOOGLE_ADS', `${res.status} ${await res.text()}`);
    const body = (await res.json()) as { results?: Record<string, unknown>[]; nextPageToken?: string };
    results.push(...(body.results ?? []));
    pageToken = body.nextPageToken;
  } while (pageToken);
  return results;
}

const STATUS_MAP: Record<string, AdCampaignSnapshot['status']> = {
  ENABLED: 'ACTIVE',
  PAUSED: 'PAUSED',
  REMOVED: 'REMOVED',
};

export async function listCampaigns(credential: GoogleAdsCredential): Promise<AdCampaignSnapshot[]> {
  // metrics.cost_micros etc. are last-30-days rolling figures — this
  // pass stores only the latest snapshot (AdCampaign has no history
  // table yet, see the go-live report), so "last 30 days" is the most
  // useful single number to show, not lifetime-to-date.
  const rows = await gaqlSearch(
    credential,
    `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
            metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value
     FROM campaign
     WHERE segments.date DURING LAST_30_DAYS`
  );

  const byId = new Map<string, AdCampaignSnapshot>();
  for (const row of rows) {
    const campaign = row.campaign as { id: string; name: string; status: string; advertisingChannelType?: string };
    const metrics = row.metrics as
      | { costMicros?: string; impressions?: string; clicks?: string; conversions?: number; conversionsValue?: number }
      | undefined;
    const existing = byId.get(campaign.id);
    const costMicros = metrics?.costMicros ? Number(metrics.costMicros) : 0;
    const impressions = metrics?.impressions ? Number(metrics.impressions) : 0;
    const clicks = metrics?.clicks ? Number(metrics.clicks) : 0;
    byId.set(campaign.id, {
      externalCampaignId: campaign.id,
      name: campaign.name,
      status: STATUS_MAP[campaign.status] ?? 'UNKNOWN',
      campaignType: campaign.advertisingChannelType,
      spend: (existing?.spend ?? 0) + costMicros / 1_000_000,
      impressions: (existing?.impressions ?? 0) + impressions,
      clicks: (existing?.clicks ?? 0) + clicks,
      conversions: (existing?.conversions ?? 0) + (metrics?.conversions ?? 0),
      conversionValue: (existing?.conversionValue ?? 0) + (metrics?.conversionsValue ?? 0),
    });
  }
  return Array.from(byId.values());
}

export async function listConversionActions(credential: GoogleAdsCredential): Promise<ConversionActionSnapshot[]> {
  const rows = await gaqlSearch(
    credential,
    `SELECT conversion_action.id, conversion_action.name, conversion_action.status, conversion_action.category
     FROM conversion_action
     WHERE conversion_action.status != 'REMOVED'`
  );
  return rows.map((row) => {
    const ca = row.conversionAction as { id: string; name: string; status: string; category?: string };
    return { id: ca.id, name: ca.name, status: ca.status, category: ca.category };
  });
}

export async function setCampaignStatus(credential: GoogleAdsCredential, externalCampaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<void> {
  const customerId = requireCustomerId(credential);
  const accessToken = await getAccessToken(credential.refreshToken);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': requireDeveloperToken(),
    'Content-Type': 'application/json',
  };
  if (credential.loginCustomerId) headers['login-customer-id'] = credential.loginCustomerId.replace(/-/g, '');

  const res = await fetch(`${API_BASE}/customers/${customerId}/campaigns:mutate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      operations: [
        {
          update: { resourceName: `customers/${customerId}/campaigns/${externalCampaignId}`, status: status === 'ACTIVE' ? 'ENABLED' : 'PAUSED' },
          updateMask: 'status',
        },
      ],
    }),
  });
  if (!res.ok) throw new AdPlatformApiError('GOOGLE_ADS', `${res.status} ${await res.text()}`);
}

export async function testConnection(credential: GoogleAdsCredential): Promise<{ customerId: string; descriptiveName?: string | undefined }> {
  const customerId = requireCustomerId(credential);
  const rows = await gaqlSearch(credential, 'SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1');
  const customer = rows[0]?.customer as { id: string; descriptiveName?: string } | undefined;
  return { customerId: customer?.id ?? customerId, descriptiveName: customer?.descriptiveName };
}
