import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import styles from '../../../../components/portal/portal-ui.module.css';
import type { AdPlatform, AdCampaignStatus } from '@prisma/client';

const VALID_PLATFORMS: readonly AdPlatform[] = ['GOOGLE_ADS', 'META_ADS', 'LINKEDIN_ADS', 'TIKTOK_ADS'];
const VALID_STATUSES: readonly AdCampaignStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'];

const PLATFORM_LABELS: Record<string, string> = {
  GOOGLE_ADS: 'Google Ads',
  META_ADS: 'Meta Ads',
  LINKEDIN_ADS: 'LinkedIn Ads',
  TIKTOK_ADS: 'TikTok Ads',
};

function StatusBadgeFor(status: string) {
  const cls = status === 'ACTIVE' ? styles.badgeActive : status === 'PAUSED' ? styles.badgeWarn : status === 'ARCHIVED' ? styles.badgeDanger : styles.badgeMuted;
  return <span className={`${styles.badge} ${cls}`}>{status}</span>;
}

function formatMoney(amount: number | null, currency: string | null): string {
  if (amount === null) return '—';
  return `${amount.toLocaleString()}${currency ? ` ${currency}` : ''}`;
}

export default async function AdminAdCampaignsPage({ searchParams }: { searchParams: Promise<{ platform?: string; status?: string }> }) {
  const principal = await requireAdminPage();
  const { platform, status } = await searchParams;
  const platformFilter = platform && VALID_PLATFORMS.includes(platform as AdPlatform) ? (platform as AdPlatform) : undefined;
  const statusFilter = status && VALID_STATUSES.includes(status as AdCampaignStatus) ? (status as AdCampaignStatus) : undefined;

  const campaigns = await prisma.adCampaign.findMany({
    where: { ...(platformFilter ? { platform: platformFilter } : {}), ...(statusFilter ? { status: statusFilter } : {}) },
    include: { office: { select: { displayName: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Ad Campaigns</h1>
        <a href="/admin/ads/campaigns/new" className={styles.button}>New campaign</a>
      </div>
      <p className={styles.subtitle}>
        Local planning record for every paid campaign across Google Ads, Meta, LinkedIn, and TikTok — synced
        performance where a platform is connected (see <a href="/admin/ads">Ads</a> for Sync now), editable here
        regardless of connection status. Changing a campaign to Active/Paused pushes that change to the real
        platform when it&apos;s already been created there.
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Platform</th>
              <th>Market</th>
              <th>Status</th>
              <th>Budget</th>
              <th>Spend (30d)</th>
              <th>Conversions (30d)</th>
              <th>Last synced</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 && (
              <tr className={styles.emptyRow}>
                <td colSpan={9}>No ad campaigns yet — create one, or connect a platform on the Ads page and Sync now to pull in what already exists there.</td>
              </tr>
            )}
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{PLATFORM_LABELS[c.platform] ?? c.platform}</td>
                <td>{c.market}{c.office ? ` (${c.office.displayName})` : ''}</td>
                <td>{StatusBadgeFor(c.status)}</td>
                <td>{formatMoney(c.budgetAmount, c.budgetCurrency)}{c.budgetType ? ` / ${c.budgetType}` : ''}</td>
                <td>{formatMoney(c.spend, c.metricsCurrency)}</td>
                <td>{c.conversions ?? '—'}</td>
                <td>{c.lastSyncedAt ? c.lastSyncedAt.toLocaleDateString() : 'Never'}</td>
                <td><a href={`/admin/ads/campaigns/${c.id}`}>Manage</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}
