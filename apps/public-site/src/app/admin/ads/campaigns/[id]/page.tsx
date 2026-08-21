import { notFound } from 'next/navigation';
import { requireAdminPage } from '../../../../../lib/portal/page-guard';
import { prisma } from '../../../../../lib/portal/db';
import { PortalShell } from '../../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../../nav-links';
import { getAllOffices } from '../../../../../lib/portal/offices';
import { AdCampaignForm } from '../AdCampaignForm';
import { AdCampaignStatusForm } from '../AdCampaignStatusForm';
import styles from '../../../../../components/portal/portal-ui.module.css';

function formatMoney(amount: number | null, currency: string | null): string {
  if (amount === null) return '—';
  return `${amount.toLocaleString()}${currency ? ` ${currency}` : ''}`;
}

export default async function AdCampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireAdminPage();
  const { id } = await params;

  const [campaign, offices, landingPages, contentCampaigns] = await Promise.all([
    prisma.adCampaign.findUnique({ where: { id } }),
    getAllOffices(),
    prisma.landingPage.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    prisma.campaign.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  if (!campaign) notFound();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <a href="/admin/ads/campaigns" className={styles.backLink}>← Ad Campaigns</a>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{campaign.name}</h1>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Status</h2>
        <AdCampaignStatusForm id={campaign.id} name={campaign.name} currentStatus={campaign.status} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Synced performance {campaign.lastSyncedAt ? `(as of ${campaign.lastSyncedAt.toLocaleString()})` : '(never synced)'}</h2>
        {campaign.externalCampaignId ? (
          <div className={styles.cardMeta}>
            <p>External ID: {campaign.externalCampaignId}</p>
            <p>
              Spend (30d): {formatMoney(campaign.spend, campaign.metricsCurrency)} · Impressions: {campaign.impressions ?? '—'} · Clicks: {campaign.clicks ?? '—'} ·
              {' '}Conversions: {campaign.conversions ?? '—'} · Conversion value: {formatMoney(campaign.conversionValue, campaign.metricsCurrency)}
            </p>
            {campaign.lastSyncError && <p className={styles.errorMessage} role="alert">{campaign.lastSyncError}</p>}
          </div>
        ) : (
          <p className={styles.cardMeta}>Not yet matched to a campaign on the actual platform — created here as a local plan only. Sync now on the Ads page will match it up automatically once it exists there with the same name.</p>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Details</h2>
        <AdCampaignForm
          initial={{
            id: campaign.id,
            platform: campaign.platform,
            market: campaign.market,
            officeId: campaign.officeId,
            name: campaign.name,
            campaignType: campaign.campaignType,
            landingPageId: campaign.landingPageId,
            contentCampaignId: campaign.contentCampaignId,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            budgetAmount: campaign.budgetAmount,
            budgetCurrency: campaign.budgetCurrency,
            budgetType: campaign.budgetType,
            conversionReference: campaign.conversionReference,
            utmSource: campaign.utmSource,
            utmMedium: campaign.utmMedium,
            utmCampaign: campaign.utmCampaign,
            utmContent: campaign.utmContent,
            utmTerm: campaign.utmTerm,
            notes: campaign.notes,
          }}
          offices={offices.map((o) => ({ id: o.id, label: o.displayName }))}
          landingPages={landingPages.map((lp) => ({ id: lp.id, label: lp.title }))}
          contentCampaigns={contentCampaigns.map((c) => ({ id: c.id, label: c.name }))}
        />
      </div>
    </PortalShell>
  );
}
