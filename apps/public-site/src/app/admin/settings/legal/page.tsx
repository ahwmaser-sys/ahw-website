import { requireSuperAdminPage } from '../../../../lib/portal/page-guard';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { getAllLegalPages, LEGAL_PAGE_ROUTES } from '../../../../lib/portal/legal-pages';
import { LegalPageForm } from './LegalPageForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export default async function AdminLegalPagesPage() {
  const principal = await requireSuperAdminPage();
  const pages = await getAllLegalPages();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Legal Pages</h1>
      </div>
      <p className={styles.subtitle}>
        Privacy Policy, Terms of Service, Cookie Policy, and Data Deletion — the four documents Meta, Google, and
        LinkedIn developer apps reference. Each lives at a stable URL; only the content below is edited here.
      </p>

      {pages.map((page) => (
        <div key={page.type} className={styles.section}>
          <h2 className={styles.sectionTitle}>{page.title}</h2>
          <LegalPageForm page={page} route={LEGAL_PAGE_ROUTES[page.type]} />
        </div>
      ))}
    </PortalShell>
  );
}
