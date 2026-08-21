import { requireAdminPage } from '../../../../../lib/portal/page-guard';
import { prisma } from '../../../../../lib/portal/db';
import { PortalShell } from '../../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../../nav-links';
import { getAllOffices } from '../../../../../lib/portal/offices';
import { AdCampaignForm } from '../AdCampaignForm';
import styles from '../../../../../components/portal/portal-ui.module.css';

export default async function NewAdCampaignPage() {
  const principal = await requireAdminPage();

  const [offices, landingPages, contentCampaigns] = await Promise.all([
    getAllOffices(),
    prisma.landingPage.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    prisma.campaign.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <a href="/admin/ads/campaigns" className={styles.backLink}>← Ad Campaigns</a>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>New ad campaign</h1>
      </div>
      <p className={styles.subtitle}>Creates a local planning record. If the campaign already exists on the platform, Sync now on the Ads page will match it up by name once created there — or set its external ID after creating it here.</p>
      <AdCampaignForm
        offices={offices.map((o) => ({ id: o.id, label: o.displayName }))}
        landingPages={landingPages.map((lp) => ({ id: lp.id, label: lp.title }))}
        contentCampaigns={contentCampaigns.map((c) => ({ id: c.id, label: c.name }))}
      />
    </PortalShell>
  );
}
