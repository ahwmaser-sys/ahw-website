import type { ComponentType } from 'react';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { TestConnectionForm, DisconnectForm } from '../settings/integrations/TestDisconnectForms';
import { AdOAuthConnectLink, GoogleAdsFollowUpForm, MetaAdsFollowUpForm, LinkedInAdsFollowUpForm, TikTokAdsFollowUpForm, SyncNowForm } from './AdsConnectForms';
import { getGoogleAdsConversionStatus } from '../../../lib/portal/actions/ads';
import styles from '../../../components/portal/portal-ui.module.css';
import type { IntegrationConfig, AdPlatform } from '@prisma/client';

const AD_TYPES = ['GOOGLE_ADS', 'META_ADS', 'LINKEDIN_ADS', 'TIKTOK_ADS'] as const;

const LABELS: Record<(typeof AD_TYPES)[number], string> = {
  GOOGLE_ADS: 'Google Ads',
  META_ADS: 'Meta Ads',
  LINKEDIN_ADS: 'LinkedIn Ads',
  TIKTOK_ADS: 'TikTok Ads',
};

const FOLLOW_UP_FORMS: Record<(typeof AD_TYPES)[number], ComponentType> = {
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

export default async function AdminAdsOverviewPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const principal = await requireAdminPage();
  const params = await searchParams;

  const [configs, campaignCounts, conversionStatus] = await Promise.all([
    prisma.integrationConfig.findMany({ where: { type: { in: [...AD_TYPES] } }, include: { connectedBy: { select: { name: true, email: true } } } }),
    prisma.adCampaign.groupBy({ by: ['platform', 'status'], _count: true }),
    getGoogleAdsConversionStatus(),
  ]);

  const configByType = new Map<string, ConfigWithConnectedBy>();
  for (const config of configs) configByType.set(config.type, config);

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
        {conversionStatus.connected === false ? (
          <p className={styles.cardMeta}>Connect Google Ads below to check this conversion&apos;s status. Tracking on the site itself is already live regardless — this only reads back its status from Google Ads.</p>
        ) : conversionStatus.found ? (
          <p className={styles.cardMeta}>
            <span className={`${styles.badge} ${styles.badgeActive}`}>FOUND</span> &quot;{conversionStatus.conversion.name}&quot; — status: {conversionStatus.conversion.status}
            {conversionStatus.conversion.category && <> · category: {conversionStatus.conversion.category}</>} · id: {conversionStatus.conversion.id}
          </p>
        ) : (
          <p className={styles.cardMeta}>
            <span className={`${styles.badge} ${styles.badgeWarn}`}>NOT FOUND</span> Could not find a conversion action named &quot;Phone Click – Website&quot; on the connected account.
            {conversionStatus.error && <> {conversionStatus.error}</>} This does not mean tracking is broken — verify directly in Google Ads → Goals → Conversions.
          </p>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Platform connections</h2>
        <div className={styles.cardList}>
          {AD_TYPES.map((type) => {
            const config = configByType.get(type);
            const needsFollowUp = Boolean((config?.metadata as { needsFollowUp?: boolean } | null)?.needsFollowUp);
            const totals = totalsByPlatform.get(type as AdPlatform);
            const FollowUpForm = FOLLOW_UP_FORMS[type];
            return (
              <div key={type} className={styles.card}>
                <div className={styles.cardHeader}>
                  <strong>{LABELS[type]}</strong>
                  <StatusBadge config={config} />
                </div>
                <ConfigDetails config={config} />
                {totals && <p className={styles.cardMeta}>{totals.active} active / {totals.total} tracked campaign(s) locally.</p>}
                {needsFollowUp && <FollowUpForm />}
                <div className={styles.buttonRow}>
                  {config?.status === 'CONNECTED' || config?.status === 'ERROR' ? (
                    <>
                      <TestConnectionForm type={type} />
                      <SyncNowForm platform={type} />
                      <DisconnectForm type={type} />
                    </>
                  ) : !needsFollowUp ? (
                    <AdOAuthConnectLink type={type} />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PortalShell>
  );
}
