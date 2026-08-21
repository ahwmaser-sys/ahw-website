import { AdPlatformApiError, type AdCampaignSnapshot } from './types';

// TikTok Business API (open_api v1.3 — business-api.tiktok.com). Plain
// fetch, no SDK. Requires TikTok for Business Marketing API app approval
// (see the manual's TikTok section) — genuinely absent from this
// codebase before this pass, so this is entirely new infrastructure, not
// an extension of anything existing.

export interface TikTokAdsCredential {
  accessToken: string;
  advertiserId?: string | undefined; // collected via OAuth (advertiser_ids) or the Integrations follow-up form if that came back empty
}

const API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';

function requireAdvertiser(credential: TikTokAdsCredential): string {
  if (!credential.advertiserId) throw new AdPlatformApiError('TIKTOK_ADS', 'Missing TikTok Advertiser ID — finish setup on the Integrations page.');
  return credential.advertiserId;
}

function headers(accessToken: string): Record<string, string> {
  return { 'Access-Token': accessToken, 'Content-Type': 'application/json' };
}

const STATUS_MAP: Record<string, AdCampaignSnapshot['status']> = {
  CAMPAIGN_STATUS_ENABLE: 'ACTIVE',
  CAMPAIGN_STATUS_DISABLE: 'PAUSED',
  CAMPAIGN_STATUS_DELETE: 'REMOVED',
};

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function listCampaigns(credential: TikTokAdsCredential): Promise<AdCampaignSnapshot[]> {
  const advertiserId = requireAdvertiser(credential);

  const campaignsRes = await fetch(`${API_BASE}/campaign/get/?${new URLSearchParams({ advertiser_id: advertiserId, page: '1', page_size: '200' }).toString()}`, {
    headers: headers(credential.accessToken),
  });
  if (!campaignsRes.ok) throw new AdPlatformApiError('TIKTOK_ADS', `${campaignsRes.status} ${await campaignsRes.text()}`);
  const campaignsBody = (await campaignsRes.json()) as {
    code: number;
    message: string;
    data?: { list: { campaign_id: string; campaign_name: string; operation_status: string; objective_type?: string }[] };
  };
  if (campaignsBody.code !== 0) throw new AdPlatformApiError('TIKTOK_ADS', campaignsBody.message);
  const campaigns = campaignsBody.data?.list ?? [];
  if (campaigns.length === 0) return [];

  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const reportRes = await fetch(
    `${API_BASE}/report/integrated/get/?${new URLSearchParams({
      advertiser_id: advertiserId,
      report_type: 'BASIC',
      data_level: 'AUCTION_CAMPAIGN',
      dimensions: JSON.stringify(['campaign_id']),
      metrics: JSON.stringify(['spend', 'impressions', 'clicks', 'conversion', 'conversion_value']),
      start_date: formatDate(start),
      end_date: formatDate(end),
      page: '1',
      page_size: '200',
    }).toString()}`,
    { headers: headers(credential.accessToken) }
  );
  const metricsByCampaign = new Map<
    string,
    { spend?: number | undefined; impressions?: number | undefined; clicks?: number | undefined; conversions?: number | undefined; conversionValue?: number | undefined }
  >();
  if (reportRes.ok) {
    const reportBody = (await reportRes.json()) as {
      code: number;
      data?: { list: { dimensions: { campaign_id: string }; metrics: { spend?: string; impressions?: string; clicks?: string; conversion?: string; conversion_value?: string } }[] };
    };
    if (reportBody.code === 0) {
      for (const row of reportBody.data?.list ?? []) {
        metricsByCampaign.set(row.dimensions.campaign_id, {
          spend: row.metrics.spend ? Number(row.metrics.spend) : undefined,
          impressions: row.metrics.impressions ? Number(row.metrics.impressions) : undefined,
          clicks: row.metrics.clicks ? Number(row.metrics.clicks) : undefined,
          conversions: row.metrics.conversion ? Number(row.metrics.conversion) : undefined,
          conversionValue: row.metrics.conversion_value ? Number(row.metrics.conversion_value) : undefined,
        });
      }
    }
  }

  return campaigns.map((c) => {
    const metrics = metricsByCampaign.get(c.campaign_id);
    return {
      externalCampaignId: c.campaign_id,
      name: c.campaign_name,
      status: STATUS_MAP[c.operation_status] ?? 'UNKNOWN',
      campaignType: c.objective_type,
      spend: metrics?.spend,
      impressions: metrics?.impressions,
      clicks: metrics?.clicks,
      conversions: metrics?.conversions,
      conversionValue: metrics?.conversionValue,
    };
  });
}

export async function setCampaignStatus(credential: TikTokAdsCredential, externalCampaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<void> {
  const advertiserId = requireAdvertiser(credential);
  const res = await fetch(`${API_BASE}/campaign/status/update/`, {
    method: 'POST',
    headers: headers(credential.accessToken),
    body: JSON.stringify({
      advertiser_id: advertiserId,
      campaign_ids: [externalCampaignId],
      operation_status: status === 'ACTIVE' ? 'ENABLE' : 'DISABLE',
    }),
  });
  if (!res.ok) throw new AdPlatformApiError('TIKTOK_ADS', `${res.status} ${await res.text()}`);
  const body = (await res.json()) as { code: number; message: string };
  if (body.code !== 0) throw new AdPlatformApiError('TIKTOK_ADS', body.message);
}

export async function testConnection(credential: TikTokAdsCredential): Promise<{ advertiserName?: string | undefined }> {
  const advertiserId = requireAdvertiser(credential);
  const res = await fetch(`${API_BASE}/advertiser/info/?${new URLSearchParams({ advertiser_ids: JSON.stringify([advertiserId]) }).toString()}`, {
    headers: headers(credential.accessToken),
  });
  if (!res.ok) throw new AdPlatformApiError('TIKTOK_ADS', `${res.status} ${await res.text()}`);
  const body = (await res.json()) as { code: number; message: string; data?: { list: { name?: string }[] } };
  if (body.code !== 0) throw new AdPlatformApiError('TIKTOK_ADS', body.message);
  return { advertiserName: body.data?.list[0]?.name };
}
