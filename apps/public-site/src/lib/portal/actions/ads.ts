'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { AdPlatform, AdCampaignStatus } from '@prisma/client';
import { requireSession, requireRole } from '../auth-guard';
import { SUPER_ADMIN_ONLY, STAFF_ROLES } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import { connectIntegration, getIntegrationCredential } from '../integrations/store';
import type { ActionState } from '../../../components/portal/ActionForm';
import * as googleAds from '../ads/google-ads';
import * as metaAds from '../ads/meta-ads';
import * as linkedInAds from '../ads/linkedin-ads';
import * as tiktokAds from '../ads/tiktok-ads';
import { AdPlatformApiError, type AdCampaignSnapshot, type ConversionActionSnapshot } from '../ads/types';

const ADS_PATH = '/admin/ads';

// ── Connection follow-up forms ──
// Mirrors completeLinkedInConnection/completeGoogleBusinessConnection in
// integrations.ts: the OAuth exchange alone never returns an ad
// account/customer id (one login can have access to many), so every ad
// platform here always needs this one extra manual step before it's
// actually usable.

// officeId is present on every follow-up form as a hidden field
// (undefined for the company-wide card, a real id for a per-office
// card — see AdsConnectForms.tsx / app/admin/ads/page.tsx) so a
// business that runs one Google/Meta/LinkedIn/TikTok Ads account per
// market can complete each market's connection independently, without
// them overwriting each other. getIntegrationCredential/connectIntegration
// already support this generically (same officeId mechanism the four
// social platforms have always used) — no schema change needed.

const googleAdsFollowUpSchema = z.object({
  customerId: z.string().trim().min(1, 'Customer ID is required.'),
  loginCustomerId: z.string().trim().optional(),
  officeId: z.string().trim().optional(),
});

export async function completeGoogleAdsConnection(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = googleAdsFollowUpSchema.safeParse({
    customerId: formData.get('customerId'),
    loginCustomerId: formData.get('loginCustomerId') || undefined,
    officeId: formData.get('officeId') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const existing = await getIntegrationCredential<googleAds.GoogleAdsCredential>('GOOGLE_ADS', parsed.data.officeId);
  if (!existing) return { error: 'Connect via OAuth first.' };

  await connectIntegration(
    'GOOGLE_ADS',
    { ...existing, customerId: parsed.data.customerId.replace(/-/g, ''), loginCustomerId: parsed.data.loginCustomerId?.replace(/-/g, '') },
    { metadata: { needsFollowUp: false }, connectedById: principal.userId, ...(parsed.data.officeId ? { officeId: parsed.data.officeId } : {}) }
  );
  await recordActivity({ actorId: principal.userId, action: 'admin.integration_connected', entityType: 'IntegrationConfig', entityId: parsed.data.officeId ? `GOOGLE_ADS:${parsed.data.officeId}` : 'GOOGLE_ADS' });
  revalidatePath(ADS_PATH);
  return { success: 'Google Ads connection completed.' };
}

const metaAdsFollowUpSchema = z.object({ adAccountId: z.string().trim().min(1, 'Ad Account ID is required.'), officeId: z.string().trim().optional() });

export async function completeMetaAdsConnection(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = metaAdsFollowUpSchema.safeParse({ adAccountId: formData.get('adAccountId'), officeId: formData.get('officeId') || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const existing = await getIntegrationCredential<metaAds.MetaAdsCredential>('META_ADS', parsed.data.officeId);
  if (!existing) return { error: 'Connect via OAuth first.' };

  await connectIntegration(
    'META_ADS',
    { ...existing, adAccountId: parsed.data.adAccountId.replace(/^act_/, '') },
    { metadata: { needsFollowUp: false }, connectedById: principal.userId, ...(parsed.data.officeId ? { officeId: parsed.data.officeId } : {}) }
  );
  await recordActivity({ actorId: principal.userId, action: 'admin.integration_connected', entityType: 'IntegrationConfig', entityId: parsed.data.officeId ? `META_ADS:${parsed.data.officeId}` : 'META_ADS' });
  revalidatePath(ADS_PATH);
  return { success: 'Meta Ads connection completed.' };
}

const linkedInAdsFollowUpSchema = z.object({ adAccountId: z.string().trim().min(1, 'Ad Account ID is required.'), officeId: z.string().trim().optional() });

export async function completeLinkedInAdsConnection(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = linkedInAdsFollowUpSchema.safeParse({ adAccountId: formData.get('adAccountId'), officeId: formData.get('officeId') || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const existing = await getIntegrationCredential<linkedInAds.LinkedInAdsCredential>('LINKEDIN_ADS', parsed.data.officeId);
  if (!existing) return { error: 'Connect via OAuth first.' };

  await connectIntegration(
    'LINKEDIN_ADS',
    { ...existing, adAccountId: parsed.data.adAccountId },
    { metadata: { needsFollowUp: false }, connectedById: principal.userId, ...(parsed.data.officeId ? { officeId: parsed.data.officeId } : {}) }
  );
  await recordActivity({ actorId: principal.userId, action: 'admin.integration_connected', entityType: 'IntegrationConfig', entityId: parsed.data.officeId ? `LINKEDIN_ADS:${parsed.data.officeId}` : 'LINKEDIN_ADS' });
  revalidatePath(ADS_PATH);
  return { success: 'LinkedIn Ads connection completed.' };
}

const tiktokAdsFollowUpSchema = z.object({ advertiserId: z.string().trim().min(1, 'Advertiser ID is required.'), officeId: z.string().trim().optional() });

export async function completeTikTokAdsConnection(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = tiktokAdsFollowUpSchema.safeParse({ advertiserId: formData.get('advertiserId'), officeId: formData.get('officeId') || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const existing = await getIntegrationCredential<tiktokAds.TikTokAdsCredential>('TIKTOK_ADS', parsed.data.officeId);
  if (!existing) return { error: 'Connect via OAuth first.' };

  await connectIntegration(
    'TIKTOK_ADS',
    { ...existing, advertiserId: parsed.data.advertiserId },
    { metadata: { needsFollowUp: false }, connectedById: principal.userId, ...(parsed.data.officeId ? { officeId: parsed.data.officeId } : {}) }
  );
  await recordActivity({ actorId: principal.userId, action: 'admin.integration_connected', entityType: 'IntegrationConfig', entityId: parsed.data.officeId ? `TIKTOK_ADS:${parsed.data.officeId}` : 'TIKTOK_ADS' });
  revalidatePath(ADS_PATH);
  return { success: 'TikTok Ads connection completed.' };
}

// ── Sync (manual "Sync now" — no cron/background infra exists anywhere
// else in this app; see the go-live report for why that stays a
// deliberate, honest limitation rather than new infrastructure invented
// just for this feature) ──

const syncSchema = z.object({ platform: z.enum(['GOOGLE_ADS', 'META_ADS', 'LINKEDIN_ADS', 'TIKTOK_ADS']), officeId: z.string().trim().optional() });

async function fetchSnapshots(platform: AdPlatform, officeId?: string): Promise<AdCampaignSnapshot[]> {
  switch (platform) {
    case 'GOOGLE_ADS': {
      const cred = await getIntegrationCredential<googleAds.GoogleAdsCredential>('GOOGLE_ADS', officeId);
      if (!cred) throw new AdPlatformApiError('GOOGLE_ADS', 'Not connected.');
      return googleAds.listCampaigns(cred);
    }
    case 'META_ADS': {
      const cred = await getIntegrationCredential<metaAds.MetaAdsCredential>('META_ADS', officeId);
      if (!cred) throw new AdPlatformApiError('META_ADS', 'Not connected.');
      return metaAds.listCampaigns(cred);
    }
    case 'LINKEDIN_ADS': {
      const cred = await getIntegrationCredential<linkedInAds.LinkedInAdsCredential>('LINKEDIN_ADS', officeId);
      if (!cred) throw new AdPlatformApiError('LINKEDIN_ADS', 'Not connected.');
      return linkedInAds.listCampaigns(cred);
    }
    case 'TIKTOK_ADS': {
      const cred = await getIntegrationCredential<tiktokAds.TikTokAdsCredential>('TIKTOK_ADS', officeId);
      if (!cred) throw new AdPlatformApiError('TIKTOK_ADS', 'Not connected.');
      return tiktokAds.listCampaigns(cred);
    }
  }
}

// Pulls every campaign currently on the platform and upserts it into
// AdCampaign, matched on (platform, externalCampaignId). A campaign that
// exists on the platform but not yet locally is created as a new row
// (status ARCHIVED left alone, DRAFT default market "Unspecified" —
// admin edits it in afterward to set market/office/notes); a campaign
// that already has a local row only has its synced fields touched,
// never the admin-owned fields (market, notes, UTM, conversionReference).
export async function syncAdPlatformAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);
  const parsed = syncSchema.safeParse({ platform: formData.get('platform'), officeId: formData.get('officeId') || undefined });
  if (!parsed.success) return { error: 'Invalid platform.' };
  const { platform, officeId } = parsed.data;
  const syncLabel = officeId ? `${platform}:${officeId}` : platform;

  try {
    const snapshots = await fetchSnapshots(platform, officeId);
    let created = 0;
    let updated = 0;

    for (const snap of snapshots) {
      const existing = await prisma.adCampaign.findFirst({ where: { platform, externalCampaignId: snap.externalCampaignId } });
      const metricsData = {
        lastSyncedAt: new Date(),
        lastSyncError: null,
        spend: snap.spend ?? null,
        impressions: snap.impressions ?? null,
        clicks: snap.clicks ?? null,
        conversions: snap.conversions ?? null,
        conversionValue: snap.conversionValue ?? null,
      };
      if (existing) {
        // Never overwrites officeId/market on an existing row — those
        // are admin-owned (same rule as name/notes/UTM below), so a
        // resync never silently reassigns a campaign the admin already
        // placed under a market.
        await prisma.adCampaign.update({
          where: { id: existing.id },
          data: {
            name: snap.name,
            status: snap.status === 'ACTIVE' ? 'ACTIVE' : snap.status === 'PAUSED' ? 'PAUSED' : existing.status,
            campaignType: snap.campaignType ?? existing.campaignType,
            ...metricsData,
          },
        });
        updated++;
      } else {
        await prisma.adCampaign.create({
          data: {
            platform,
            // A campaign synced from an office-scoped connection is
            // known to belong to that office/market immediately — no
            // "Unspecified" placeholder needed. A company-wide
            // connection can't infer the market on its own, so it still
            // falls back to the placeholder for the admin to fill in.
            market: officeId ? await officeMarketLabel(officeId) : 'Unspecified — set on this campaign',
            officeId: officeId ?? null,
            name: snap.name,
            externalCampaignId: snap.externalCampaignId,
            status: snap.status === 'ACTIVE' ? 'ACTIVE' : snap.status === 'PAUSED' ? 'PAUSED' : 'DRAFT',
            campaignType: snap.campaignType ?? null,
            createdById: principal.userId,
            ...metricsData,
          },
        });
        created++;
      }
    }

    await recordActivity({
      actorId: principal.userId,
      action: 'admin.ads_synced',
      entityType: 'AdCampaign',
      entityId: syncLabel,
      metadata: { platform, officeId, created, updated, total: snapshots.length },
    });
    revalidatePath(ADS_PATH);
    revalidatePath(`${ADS_PATH}/campaigns`);
    return { success: `Synced ${snapshots.length} campaign(s) from ${syncLabel} — ${created} new, ${updated} updated.` };
  } catch (error) {
    const message = error instanceof AdPlatformApiError ? error.message : error instanceof Error ? error.message : 'Sync failed.';
    await recordActivity({ actorId: principal.userId, action: 'admin.ads_sync_failed', entityType: 'AdCampaign', entityId: syncLabel, metadata: { error: message } });
    return { error: `Sync failed: ${message}` };
  }
}

async function officeMarketLabel(officeId: string): Promise<string> {
  const office = await prisma.office.findUnique({ where: { id: officeId }, select: { displayName: true } });
  return office?.displayName ?? 'Unspecified — set on this campaign';
}

// ── Conversion Center: read-only lookup of the existing Google Ads
// phone-click conversion, by name. Never creates or modifies a
// conversion action — this app has no write access to conversion
// actions, only campaigns, and the whole point of this task is to
// surface the ALREADY-EXISTING "Phone Click – Website" conversion, never
// to create a second one. ──

const PHONE_CONVERSION_NAME = 'Phone Click – Website';

export interface GoogleAdsConversionCheck {
  label: string; // 'Company-wide' or the office's display name
  officeId: string | null;
  found: boolean;
  conversion?: ConversionActionSnapshot;
  error?: string;
}

// Checks every connected Google Ads account (the company-wide one, plus
// any per-office ones — a business can run either or both, see
// ad-oauth.ts) for the existing "Phone Click – Website" conversion by
// name. A market-scoped Google Ads account only needs to be checked if
// its own site traffic actually fires that tag; most setups will only
// ever have it on one account, which this surfaces rather than assumes.
export async function getGoogleAdsConversionStatus(): Promise<GoogleAdsConversionCheck[]> {
  const configs = await prisma.integrationConfig.findMany({
    where: { type: 'GOOGLE_ADS', status: 'CONNECTED' },
    include: { office: { select: { displayName: true } } },
  });
  if (configs.length === 0) return [];

  const results: GoogleAdsConversionCheck[] = [];
  for (const config of configs) {
    const label = config.office?.displayName ?? 'Company-wide';
    const cred = await getIntegrationCredential<googleAds.GoogleAdsCredential>('GOOGLE_ADS', config.officeId);
    if (!cred?.customerId) {
      results.push({ label, officeId: config.officeId, found: false, error: 'Missing Customer ID — finish setup on Admin → Ads.' });
      continue;
    }
    try {
      const actions = await googleAds.listConversionActions(cred);
      const match = actions.find((a) => a.name === PHONE_CONVERSION_NAME);
      results.push(match ? { label, officeId: config.officeId, found: true, conversion: match } : { label, officeId: config.officeId, found: false });
    } catch (error) {
      results.push({ label, officeId: config.officeId, found: false, error: error instanceof AdPlatformApiError ? error.message : 'Lookup failed.' });
    }
  }
  return results;
}

// ── AdCampaign CRUD (local planning record — always safe, never touches
// the actual ad platform on its own; see setAdCampaignStatusAction below
// for the one action that does) ──

const createSchema = z.object({
  platform: z.enum(['GOOGLE_ADS', 'META_ADS', 'LINKEDIN_ADS', 'TIKTOK_ADS']),
  market: z.string().trim().min(1, 'Market is required.'),
  officeId: z.string().trim().optional(),
  name: z.string().trim().min(1, 'Name is required.'),
  campaignType: z.string().trim().optional(),
  landingPageId: z.string().trim().optional(),
  contentCampaignId: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  budgetAmount: z.string().trim().optional(),
  budgetCurrency: z.string().trim().optional(),
  budgetType: z.string().trim().optional(),
  conversionReference: z.string().trim().optional(),
  utmSource: z.string().trim().optional(),
  utmMedium: z.string().trim().optional(),
  utmCampaign: z.string().trim().optional(),
  utmContent: z.string().trim().optional(),
  utmTerm: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function optionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== 'string') return undefined;
  const s = value.trim();
  return s ? s : undefined;
}

export async function createAdCampaign(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);
  const parsed = createSchema.safeParse({
    platform: formData.get('platform'),
    market: formData.get('market'),
    officeId: optionalString(formData.get('officeId')),
    name: formData.get('name'),
    campaignType: optionalString(formData.get('campaignType')),
    landingPageId: optionalString(formData.get('landingPageId')),
    contentCampaignId: optionalString(formData.get('contentCampaignId')),
    startDate: optionalString(formData.get('startDate')),
    endDate: optionalString(formData.get('endDate')),
    budgetAmount: optionalString(formData.get('budgetAmount')),
    budgetCurrency: optionalString(formData.get('budgetCurrency')),
    budgetType: optionalString(formData.get('budgetType')),
    conversionReference: optionalString(formData.get('conversionReference')),
    utmSource: optionalString(formData.get('utmSource')),
    utmMedium: optionalString(formData.get('utmMedium')),
    utmCampaign: optionalString(formData.get('utmCampaign')),
    utmContent: optionalString(formData.get('utmContent')),
    utmTerm: optionalString(formData.get('utmTerm')),
    notes: optionalString(formData.get('notes')),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const d = parsed.data;

  await prisma.adCampaign.create({
    data: {
      platform: d.platform,
      market: d.market,
      officeId: d.officeId ?? null,
      name: d.name,
      campaignType: d.campaignType ?? null,
      landingPageId: d.landingPageId ?? null,
      contentCampaignId: d.contentCampaignId ?? null,
      startDate: d.startDate ? new Date(d.startDate) : null,
      endDate: d.endDate ? new Date(d.endDate) : null,
      budgetAmount: d.budgetAmount ? Number(d.budgetAmount) : null,
      budgetCurrency: d.budgetCurrency ?? null,
      budgetType: d.budgetType ?? null,
      conversionReference: d.conversionReference ?? null,
      utmSource: d.utmSource ?? null,
      utmMedium: d.utmMedium ?? null,
      utmCampaign: d.utmCampaign ?? null,
      utmContent: d.utmContent ?? null,
      utmTerm: d.utmTerm ?? null,
      notes: d.notes ?? null,
      createdById: principal.userId,
    },
  });
  await recordActivity({ actorId: principal.userId, action: 'admin.ad_campaign_created', entityType: 'AdCampaign', metadata: { platform: d.platform, name: d.name, market: d.market } });
  revalidatePath(`${ADS_PATH}/campaigns`);
  return { success: 'Ad campaign created.' };
}

const updateSchema = createSchema.extend({ id: z.string().trim().min(1) });

export async function updateAdCampaign(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);
  const parsed = updateSchema.safeParse({
    id: formData.get('id'),
    platform: formData.get('platform'),
    market: formData.get('market'),
    officeId: optionalString(formData.get('officeId')),
    name: formData.get('name'),
    campaignType: optionalString(formData.get('campaignType')),
    landingPageId: optionalString(formData.get('landingPageId')),
    contentCampaignId: optionalString(formData.get('contentCampaignId')),
    startDate: optionalString(formData.get('startDate')),
    endDate: optionalString(formData.get('endDate')),
    budgetAmount: optionalString(formData.get('budgetAmount')),
    budgetCurrency: optionalString(formData.get('budgetCurrency')),
    budgetType: optionalString(formData.get('budgetType')),
    conversionReference: optionalString(formData.get('conversionReference')),
    utmSource: optionalString(formData.get('utmSource')),
    utmMedium: optionalString(formData.get('utmMedium')),
    utmCampaign: optionalString(formData.get('utmCampaign')),
    utmContent: optionalString(formData.get('utmContent')),
    utmTerm: optionalString(formData.get('utmTerm')),
    notes: optionalString(formData.get('notes')),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const d = parsed.data;

  await prisma.adCampaign.update({
    where: { id: d.id },
    data: {
      market: d.market,
      officeId: d.officeId ?? null,
      name: d.name,
      campaignType: d.campaignType ?? null,
      landingPageId: d.landingPageId ?? null,
      contentCampaignId: d.contentCampaignId ?? null,
      startDate: d.startDate ? new Date(d.startDate) : null,
      endDate: d.endDate ? new Date(d.endDate) : null,
      budgetAmount: d.budgetAmount ? Number(d.budgetAmount) : null,
      budgetCurrency: d.budgetCurrency ?? null,
      budgetType: d.budgetType ?? null,
      conversionReference: d.conversionReference ?? null,
      utmSource: d.utmSource ?? null,
      utmMedium: d.utmMedium ?? null,
      utmCampaign: d.utmCampaign ?? null,
      utmContent: d.utmContent ?? null,
      utmTerm: d.utmTerm ?? null,
      notes: d.notes ?? null,
    },
  });
  await recordActivity({ actorId: principal.userId, action: 'admin.ad_campaign_updated', entityType: 'AdCampaign', entityId: d.id });
  revalidatePath(`${ADS_PATH}/campaigns`);
  revalidatePath(`${ADS_PATH}/campaigns/${d.id}`);
  return { success: 'Ad campaign updated.' };
}

// ── Status change — the one action that can touch real spend, so it's
// the financially-significant REVIEW → CONFIRM → EXECUTE step the brief
// requires: SUPER_ADMIN only, and the form (see AdCampaignStatusForm)
// makes the admin type the campaign name back before this runs. If the
// campaign has an externalCampaignId AND the platform is connected, the
// status change is also pushed to the real platform — never silently:
// any platform-side failure is surfaced as an error and the local status
// is NOT changed, so the local record never claims a state the real
// campaign isn't actually in. ──

const statusSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']),
  confirmName: z.string().trim(),
});

export async function setAdCampaignStatusAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = statusSchema.safeParse({ id: formData.get('id'), status: formData.get('status'), confirmName: formData.get('confirmName') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const campaign = await prisma.adCampaign.findUnique({ where: { id: parsed.data.id } });
  if (!campaign) return { error: 'Campaign not found.' };
  if (parsed.data.confirmName !== campaign.name) {
    return { error: `Type the campaign name exactly ("${campaign.name}") to confirm this change.` };
  }

  // Only ACTIVE/PAUSED have a real platform-side equivalent this app can
  // push — COMPLETED/ARCHIVED are local-only planning states.
  if (campaign.externalCampaignId && (parsed.data.status === 'ACTIVE' || parsed.data.status === 'PAUSED')) {
    try {
      // The campaign's own officeId picks which connection's credential
      // to use — null for a campaign synced/created under the
      // company-wide connection, a real office id for one synced/created
      // under a market-scoped connection.
      await pushStatusToPlatform(campaign.platform, campaign.officeId, campaign.externalCampaignId, parsed.data.status);
    } catch (error) {
      const message = error instanceof AdPlatformApiError ? error.message : error instanceof Error ? error.message : 'Platform update failed.';
      return { error: `Not changed — the platform rejected this update: ${message}` };
    }
  }

  const oldStatus: AdCampaignStatus = campaign.status;
  await prisma.adCampaign.update({ where: { id: campaign.id }, data: { status: parsed.data.status } });
  await recordActivity({
    actorId: principal.userId,
    action: 'admin.ad_campaign_status_changed',
    entityType: 'AdCampaign',
    entityId: campaign.id,
    metadata: { name: campaign.name, platform: campaign.platform, from: oldStatus, to: parsed.data.status, pushedToPlatform: Boolean(campaign.externalCampaignId) },
  });
  revalidatePath(`${ADS_PATH}/campaigns`);
  revalidatePath(`${ADS_PATH}/campaigns/${campaign.id}`);
  return { success: `Status changed to ${parsed.data.status}${campaign.externalCampaignId ? ' (pushed to platform)' : ''}.` };
}

async function pushStatusToPlatform(platform: AdPlatform, officeId: string | null, externalCampaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<void> {
  switch (platform) {
    case 'GOOGLE_ADS': {
      const cred = await getIntegrationCredential<googleAds.GoogleAdsCredential>('GOOGLE_ADS', officeId);
      if (!cred) throw new AdPlatformApiError('GOOGLE_ADS', 'Not connected.');
      return googleAds.setCampaignStatus(cred, externalCampaignId, status);
    }
    case 'META_ADS': {
      const cred = await getIntegrationCredential<metaAds.MetaAdsCredential>('META_ADS', officeId);
      if (!cred) throw new AdPlatformApiError('META_ADS', 'Not connected.');
      return metaAds.setCampaignStatus(cred, externalCampaignId, status);
    }
    case 'LINKEDIN_ADS': {
      const cred = await getIntegrationCredential<linkedInAds.LinkedInAdsCredential>('LINKEDIN_ADS', officeId);
      if (!cred) throw new AdPlatformApiError('LINKEDIN_ADS', 'Not connected.');
      return linkedInAds.setCampaignStatus(cred, externalCampaignId, status);
    }
    case 'TIKTOK_ADS': {
      const cred = await getIntegrationCredential<tiktokAds.TikTokAdsCredential>('TIKTOK_ADS', officeId);
      if (!cred) throw new AdPlatformApiError('TIKTOK_ADS', 'Not connected.');
      return tiktokAds.setCampaignStatus(cred, externalCampaignId, status);
    }
  }
}
