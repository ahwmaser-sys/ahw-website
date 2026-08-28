import Link from 'next/link';
import type { Metadata } from 'next';
import { requireSuperAdminPage } from '../../../../lib/portal/page-guard';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { ResidentialExperienceForm } from '../ResidentialExperienceForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function NewResidentialExperiencePage() {
  const principal = await requireSuperAdminPage();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/residential-experience" className={styles.backLink}>← Residential Experience</Link>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>New Residential Experience Entry</h1>
      </div>
      <div className={styles.section}>
        <ResidentialExperienceForm />
      </div>
    </PortalShell>
  );
}
