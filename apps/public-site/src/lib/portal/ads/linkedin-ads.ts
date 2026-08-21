import { AdPlatformApiError, type AdCampaignSnapshot } from './types';

// LinkedIn Marketing API (versioned REST API — api.linkedin.com/rest,
// not the older /v2 the existing organic LinkedIn integration in
// social/linkedin.ts uses). Requires the LinkedIn Marketing Developer
// Platform program (separate approval from basic Sign In/organic
// posting — see the manual's LinkedIn section). Plain fetch, no SDK.

export interface LinkedInAdsCredential {
  accessToken: string;
  adAccountId?: string | undefined; // numeric Sponsored/Ad Account id — collected via the Integrations follow-up form
}

const API_BASE = 'https://api.linkedin.com/rest';
const LINKEDIN_VERSION = '202501';

function requireAdAccount(credential: LinkedInAdsCredential): string {
  if (!credential.adAccountId) throw new AdPlatformApiError('LINKEDIN_ADS', 'Missing LinkedIn Ad Account ID — finish setup on the Integrations page.');
  return credential.adAccountId;
}

function headers(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'LinkedIn-Version': LINKEDIN_VERSION,
    'X-Restli-Protocol-Version': '2.0.0',
  };
}

const STATUS_MAP: Record<string, AdCampaignSnapshot['status']> = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'REMOVED',
  COMPLETED: 'REMOVED',
  CANCELED: 'REMOVED',
  DRAFT: 'UNKNOWN',
};

export async function listCampaigns(credential: LinkedInAdsCredential): Promise<AdCampaignSnapshot[]> {
  const adAccountId = requireAdAccount(credential);

  const campaignsRes = await fetch(`${API_BASE}/adAccounts/${adAccountId}/adCampaigns?q=search&search=(status:(values:List(ACTIVE,PAUSED,DRAFT)))`, {
    headers: headers(credential.accessToken),
  });
  if (!campaignsRes.ok) throw new AdPlatformApiError('LINKEDIN_ADS', `${campaignsRes.status} ${await campaignsRes.text()}`);
  const campaignsBody = (await campaignsRes.json()) as { elements: { id: number; name: string; status: string; type?: string }[] };

  if (campaignsBody.elements.length === 0) return [];

  // Last-30-days analytics, one call covering all campaigns in the
  // account via the campaigns= list param.
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dateRange = (d: Date) => `(year:${d.getUTCFullYear()},month:${d.getUTCMonth() + 1},day:${d.getUTCDate()})`;
  const campaignUrns = campaignsBody.elements.map((c) => `urn:li:sponsoredCampaign:${c.id}`);
  const analyticsUrl =
    `${API_BASE}/adAnalytics?q=analytics&pivot=CAMPAIGN` +
    `&dateRange=(start:${dateRange(start)},end:${dateRange(end)})` +
    `&campaigns=List(${campaignUrns.map(encodeURIComponent).join(',')})` +
    `&fields=pivotValue,impressions,clicks,costInLocalCurrency,externalWebsiteConversions,externalWebsiteConversionValue`;
  const analyticsRes = await fetch(analyticsUrl, { headers: headers(credential.accessToken) });

  const metricsByUrn = new Map<
    string,
    { impressions?: number | undefined; clicks?: number | undefined; spend?: number | undefined; conversions?: number | undefined; conversionValue?: number | undefined }
  >();
  if (analyticsRes.ok) {
    const analyticsBody = (await analyticsRes.json()) as {
      elements: { pivotValue: string; impressions?: number; clicks?: number; costInLocalCurrency?: string; externalWebsiteConversions?: number; externalWebsiteConversionValue?: string }[];
    };
    for (const row of analyticsBody.elements) {
      metricsByUrn.set(row.pivotValue, {
        impressions: row.impressions,
        clicks: row.clicks,
        spend: row.costInLocalCurrency ? Number(row.costInLocalCurrency) : undefined,
        conversions: row.externalWebsiteConversions,
        conversionValue: row.externalWebsiteConversionValue ? Number(row.externalWebsiteConversionValue) : undefined,
      });
    }
  }

  return campaignsBody.elements.map((c) => {
    const metrics = metricsByUrn.get(`urn:li:sponsoredCampaign:${c.id}`);
    return {
      externalCampaignId: String(c.id),
      name: c.name,
      status: STATUS_MAP[c.status] ?? 'UNKNOWN',
      campaignType: c.type,
      spend: metrics?.spend,
      impressions: metrics?.impressions,
      clicks: metrics?.clicks,
      conversions: metrics?.conversions,
      conversionValue: metrics?.conversionValue,
    };
  });
}

export async function setCampaignStatus(credential: LinkedInAdsCredential, externalCampaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<void> {
  const adAccountId = requireAdAccount(credential);
  const res = await fetch(`${API_BASE}/adAccounts/${adAccountId}/adCampaigns/${externalCampaignId}`, {
    method: 'POST',
    headers: { ...headers(credential.accessToken), 'Content-Type': 'application/json', 'X-RestLi-Method': 'PARTIAL_UPDATE' },
    body: JSON.stringify({ patch: { $set: { status } } }),
  });
  if (!res.ok) throw new AdPlatformApiError('LINKEDIN_ADS', `${res.status} ${await res.text()}`);
}

export async function testConnection(credential: LinkedInAdsCredential): Promise<{ adAccountName?: string | undefined }> {
  const adAccountId = requireAdAccount(credential);
  const res = await fetch(`${API_BASE}/adAccounts/${adAccountId}`, { headers: headers(credential.accessToken) });
  if (!res.ok) throw new AdPlatformApiError('LINKEDIN_ADS', `${res.status} ${await res.text()}`);
  const body = (await res.json()) as { name?: string };
  return { adAccountName: body.name };
}
