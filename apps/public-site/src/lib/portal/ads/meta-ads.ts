import { AdPlatformApiError, type AdCampaignSnapshot } from './types';

// Meta Marketing API (Graph API v21.0 — same version the existing
// Facebook/Instagram organic integration already uses in oauth.ts/social).
// Plain fetch, no facebook-nodejs-business-sdk dependency added.

export interface MetaAdsCredential {
  accessToken: string;
  adAccountId?: string | undefined; // numeric ad account id (without the "act_" prefix) — collected via the Integrations follow-up form
}

const API_BASE = 'https://graph.facebook.com/v21.0';

function requireAdAccount(credential: MetaAdsCredential): string {
  if (!credential.adAccountId) throw new AdPlatformApiError('META_ADS', 'Missing Meta Ad Account ID — finish setup on the Integrations page.');
  return credential.adAccountId.replace(/^act_/, '');
}

const STATUS_MAP: Record<string, AdCampaignSnapshot['status']> = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  DELETED: 'REMOVED',
  ARCHIVED: 'REMOVED',
};

export async function listCampaigns(credential: MetaAdsCredential): Promise<AdCampaignSnapshot[]> {
  const adAccountId = requireAdAccount(credential);

  const campaignsRes = await fetch(
    `${API_BASE}/act_${adAccountId}/campaigns?${new URLSearchParams({
      fields: 'id,name,status,objective',
      limit: '200',
      access_token: credential.accessToken,
    }).toString()}`
  );
  if (!campaignsRes.ok) throw new AdPlatformApiError('META_ADS', `${campaignsRes.status} ${await campaignsRes.text()}`);
  const campaignsBody = (await campaignsRes.json()) as { data: { id: string; name: string; status: string; objective?: string }[] };

  // Last-30-days insights per campaign, matched back onto the campaign
  // list above (Meta's campaigns and insights are separate endpoints —
  // a campaign with zero delivery in the window simply has no insights
  // row, left as undefined rather than 0, honestly reflecting "no data").
  const insightsRes = await fetch(
    `${API_BASE}/act_${adAccountId}/insights?${new URLSearchParams({
      level: 'campaign',
      date_preset: 'last_30d',
      fields: 'campaign_id,spend,impressions,clicks,actions,action_values',
      limit: '200',
      access_token: credential.accessToken,
    }).toString()}`
  );
  const insightsByCampaign = new Map<
    string,
    { spend?: number | undefined; impressions?: number | undefined; clicks?: number | undefined; conversions?: number | undefined; conversionValue?: number | undefined }
  >();
  if (insightsRes.ok) {
    const insightsBody = (await insightsRes.json()) as {
      data: { campaign_id: string; spend?: string; impressions?: string; clicks?: string; actions?: { action_type: string; value: string }[]; action_values?: { action_type: string; value: string }[] }[];
    };
    for (const row of insightsBody.data) {
      // "lead" covers both on-site form leads and Messenger/call-click
      // style actions Meta buckets under leadgen — the single closest
      // analog to "conversions" without assuming a specific pixel event
      // name this account may or may not have configured.
      const leadAction = row.actions?.find((a) => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped');
      const leadValue = row.action_values?.find((a) => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped');
      insightsByCampaign.set(row.campaign_id, {
        spend: row.spend ? Number(row.spend) : undefined,
        impressions: row.impressions ? Number(row.impressions) : undefined,
        clicks: row.clicks ? Number(row.clicks) : undefined,
        conversions: leadAction ? Number(leadAction.value) : undefined,
        conversionValue: leadValue ? Number(leadValue.value) : undefined,
      });
    }
  }

  return campaignsBody.data.map((c) => {
    const insights = insightsByCampaign.get(c.id);
    return {
      externalCampaignId: c.id,
      name: c.name,
      status: STATUS_MAP[c.status] ?? 'UNKNOWN',
      campaignType: c.objective,
      spend: insights?.spend,
      impressions: insights?.impressions,
      clicks: insights?.clicks,
      conversions: insights?.conversions,
      conversionValue: insights?.conversionValue,
    };
  });
}

export async function setCampaignStatus(credential: MetaAdsCredential, externalCampaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<void> {
  const res = await fetch(`${API_BASE}/${externalCampaignId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ status, access_token: credential.accessToken }),
  });
  if (!res.ok) throw new AdPlatformApiError('META_ADS', `${res.status} ${await res.text()}`);
}

export async function testConnection(credential: MetaAdsCredential): Promise<{ adAccountName?: string | undefined }> {
  const adAccountId = requireAdAccount(credential);
  const res = await fetch(`${API_BASE}/act_${adAccountId}?${new URLSearchParams({ fields: 'name,account_status', access_token: credential.accessToken }).toString()}`);
  if (!res.ok) throw new AdPlatformApiError('META_ADS', `${res.status} ${await res.text()}`);
  const body = (await res.json()) as { name?: string };
  return { adAccountName: body.name };
}
