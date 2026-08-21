import type { ComponentType } from 'react';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { getAllOffices } from '../../../lib/portal/offices';
import { TestConnectionForm, DisconnectForm } from '../settings/integrations/TestDisconnectForms';
import { AdOAuthConnectLink, GoogleAdsFollowUpForm, MetaAdsFollowUpForm, LinkedInAdsFollowUpForm, TikTokAdsFollowUpForm, SyncNowForm } from './AdsConnectForms';
import { getGoogleAdsConversionStatus } from '../../../lib/portal/actions/ads';
import styles from '../../../components/portal/portal-ui.module.css';
import type { IntegrationConfig, AdPlatform, Office } from '@prisma/client';

const AD_TYPES = ['GOOGLE_ADS', 'META_ADS', 'LINKEDIN_ADS', 'TIKTOK_ADS'] as const;
type AdType = (typeof AD_TYPES)[number];

const LABELS: Record<AdType, string> = {
  GOOGLE_ADS: 'Google Ads',
  META_ADS: 'Meta Ads',
  LINKEDIN_ADS: 'LinkedIn Ads',
  TIKTOK_ADS: 'TikTok Ads',
};

const FOLLOW_UP_FORMS: Record<AdType, ComponentType<{ officeId?: string | undefined }>> = {
  GOOGLE_ADS: GoogleAdsFollowUpForm,
  META_ADS: MetaAdsFollowUpForm,
  LINKEDIN_ADS: LinkedInAdsFollowUpForm,
  TIKTOK_ADS: TikTokAdsFollowUpForm,
};

type ConfigWithConnectedBy = IntegrationConfig & { connectedBy: { name: string | null; email: string } | null };

function StatusBadge({ config }: { config: ConfigWithConnectedBy | undefined }) {
  const status = config?.status ?? 'NOT_CONNECTED';
  const badgeClass =
    status === 'CONNECTED' ? styles.badgeActive : status === 'ERROR' ? styles.badgeDanger : status === 'PENDING' ? styles.badgeWarn : styles.badgeMuted;
  return <span className={`${styles.badge} ${badgeClass}`}>{status.replace('_', ' ')}</span>;
}

// Same field set / metadata-reading convention as
// settings/integrations/page.tsx's ConfigDetails — kept as a local copy
// rather than importing a private helper from that page module, matching
// this codebase's "no shared Card/Table primitive, each admin page is
// self-contained" convention (see portal-ui.module.css).
function ConfigDetails({ config }: { config: ConfigWithConnectedBy | undefined }) {
  if (!config) return <p className={styles.cardMeta}>Never connected.</p>;
  const metadata = (config.metadata as Record<string, unknown> | null) ?? {};
  const connectedAccount = (metadata.customerId ?? metadata.descriptiveName ?? metadata.adAccountName ?? metadata.advertiserName) as string | undefined;

  return (
    <div className={styles.cardMeta}>
      <p>
        Connected account: {connectedAccount ?? '—'}
        {config.connectedBy && <> · Connected by: {config.connectedBy.name ?? config.connectedBy.email}</>}
        {config.connectedAt && <> · Connected: {config.connectedAt.toLocaleString()}</>}
      </p>
      <p>
        {config.lastSuccessAt ? `Last successful test: ${config.lastSuccessAt.toLocaleString()}` : 'No successful test yet.'}
      </p>
      {config.lastError && <p className={styles.errorMessage} role="alert">{config.lastError}</p>}
    </div>
  );
}

function configKey(type: string, officeId: string | null): string {
  return `${type}:${officeId ?? 'company'}`;
}

function ConnectionCard({
  type,
  officeId,
  config,
  totals,
}: {
  type: AdType;
  officeId?: string | undefined;
  config: ConfigWithConnectedBy | undefined;
  totals: { active: number; total: number } | undefined;
}) {
  const needsFollowUp = Boolean((config?.metadata as { needsFollowUp?: boolean } | null)?.needsFollowUp);
  const FollowUpForm = FOLLOW_UP_FORMS[type];
  return (
    <div className={styles.card}>
      <ConfigDetails config={config} />
      {totals && <p className={styles.cardMeta}>{totals.active} active / {totals.total} tracked campaign(s) locally.</p>}
      {needsFollowUp && <FollowUpForm officeId={officeId} />}
      <div className={styles.buttonRow}>
        {config?.status === 'CONNECTED' || config?.status === 'ERROR' ? (
          <>
            <TestConnectionForm type={type} {...(officeId ? { officeId } : {})} />
            <SyncNowForm platform={type} officeId={officeId} />
            <DisconnectForm type={type} {...(officeId ? { officeId } : {})} />
          </>
        ) : !needsFollowUp ? (
          <AdOAuthConnectLink type={type} officeId={officeId} />
        ) : null}
      </div>
    </div>
  );
}

export default async function AdminAdsOverviewPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const principal = await requireAdminPage();
  const params = await searchParams;

  const [configs, offices, campaignCounts, conversionChecks] = await Promise.all([
    prisma.integrationConfig.findMany({ where: { type: { in: [...AD_TYPES] } }, include: { connectedBy: { select: { name: true, email: true } } } }),
    getAllOffices(),
    prisma.adCampaign.groupBy({ by: ['platform', 'status'], _count: true }),
    getGoogleAdsConversionStatus(),
  ]);

  const configByKey = new Map<string, ConfigWithConnectedBy>();
  for (const config of configs) configByKey.set(configKey(config.type, config.officeId), config);

  const totalsByPlatform = new Map<AdPlatform, { active: number; total: number }>();
  for (const row of campaignCounts) {
    const current = totalsByPlatform.get(row.platform) ?? { active: 0, total: 0 };
    current.total += row._count;
    if (row.status === 'ACTIVE') current.active += row._count;
    totalsByPlatform.set(row.platform, current);
  }

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Ads</h1>
      </div>
      <p className={styles.subtitle}>
        Marketing Ads Control Center — connect ad platform accounts, review campaigns across Google Ads, Meta, LinkedIn,
        and TikTok, and check the existing Google Ads phone-click conversion&apos;s health. See{' '}
        <a href="/admin/ads/campaigns">Campaigns</a> for the full list and <a href="/admin/ads/utm">UTM Builder</a> for
        tracking links. Each platform&apos;s own developer app (Client ID/Secret) is a one-time infrastructure step set
        in environment variables, same as Settings → Integrations.
      </p>

      {params.connected && <p className={styles.successMessage} role="status">{params.connected.replace('_', ' ')} connected.</p>}
      {params.error && <p className={styles.errorMessage} role="alert">{decodeURIComponent(params.error)}</p>}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Phone Click – Website conversion</h2>
        {conversionChecks.length === 0 ? (
          <p className={styles.cardMeta}>Connect a Google Ads account below to check this conversion&apos;s status. Tracking on the site itself is already live regardless — this only reads back its status from Google Ads.</p>
        ) : (
          conversionChecks.map((check) => (
            <p key={check.officeId ?? 'company'} className={styles.cardMeta}>
              <strong>{check.label}:</strong>{' '}
              {check.found && check.conversion ? (
                <>
                  <span className={`${styles.badge} ${styles.badgeActive}`}>FOUND</span> &quot;{check.conversion.name}&quot; — status: {check.conversion.status}
                  {check.conversion.category && <> · category: {check.conversion.category}</>} · id: {check.conversion.id}
                </>
              ) : (
                <>
                  <span className={`${styles.badge} ${styles.badgeWarn}`}>NOT FOUND</span> Could not find a conversion action named &quot;Phone Click – Website&quot; on this account.
                  {check.error && <> {check.error}</>} This does not mean tracking is broken — verify directly in Google Ads → Goals → Conversions.
                </>
              )}
            </p>
          ))
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Platform connections — company-wide</h2>
        <p className={styles.cardMeta}>One shared account per platform, used across every market. This is the simplest setup — campaigns for different markets still live under the same account, distinguished by the Market field on each Ad Campaign.</p>
        <div className={styles.cardList}>
          {AD_TYPES.map((type) => (
            <div key={type} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong>{LABELS[type]}</strong>
                <StatusBadge config={configByKey.get(configKey(type, null))} />
              </div>
              <ConnectionCard type={type} config={configByKey.get(configKey(type, null))} totals={totalsByPlatform.get(type)} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Platform connections — per market (optional)</h2>
        <p className={styles.cardMeta}>
          Only needed if a market genuinely has its own, separate ad account (not just its own campaigns inside the
          shared account above) — e.g. Egypt and Kuwait each billed and managed as independent Google Ads accounts.
          Add a new market by creating its Office under Admin → Offices — no code change needed for it to appear here.
        </p>
        <div className={styles.cardList}>
          {offices.flatMap((office: Office) =>
            AD_TYPES.map((type) => (
              <div key={`${office.id}:${type}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <strong>{office.displayName} — {LABELS[type]}</strong>
                  <StatusBadge config={configByKey.get(configKey(type, office.id))} />
                </div>
                <ConnectionCard type={type} officeId={office.id} config={configByKey.get(configKey(type, office.id))} totals={undefined} />
              </div>
            ))
          )}
        </div>
      </div>
    </PortalShell>
  );
}
