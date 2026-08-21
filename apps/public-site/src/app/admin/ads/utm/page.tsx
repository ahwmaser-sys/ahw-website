import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { getAllOffices } from '../../../../lib/portal/offices';
import { getSiteUrl } from '../../../../lib/site-config';
import { UtmBuilderForm } from './UtmBuilderForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export default async function AdminUtmBuilderPage() {
  const principal = await requireAdminPage();

  const [offices, landingPages, siteUrl] = await Promise.all([
    getAllOffices(),
    prisma.landingPage.findMany({ where: { status: 'PUBLISHED' }, select: { title: true, slug: true }, orderBy: { title: 'asc' } }),
    getSiteUrl(),
  ]);

  const baseUrlOptions = [
    { value: siteUrl, label: 'Homepage' },
    ...offices.map((o) => ({ value: `${siteUrl}/contact/${o.slug}`, label: `Contact — ${o.displayName}` })),
    ...landingPages.map((lp) => ({ value: `${siteUrl}/lp/${lp.slug}`, label: `Landing page — ${lp.title}` })),
  ];

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <a href="/admin/ads" className={styles.backLink}>← Ads</a>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>UTM Builder</h1>
      </div>
      <p className={styles.subtitle}>
        Generates a tracking URL for use as an ad&apos;s Final URL / destination — attribution is captured
        automatically on the first page a visitor lands on from it and carried through to any contact-form
        submission. Record the same values on the matching <a href="/admin/ads/campaigns">Ad Campaign</a> so leads
        can be traced back to it in Enquiries.
      </p>
      <UtmBuilderForm baseUrlOptions={baseUrlOptions} />
    </PortalShell>
  );
}
