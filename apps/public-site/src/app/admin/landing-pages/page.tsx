import Link from 'next/link';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { CreateLandingPageForm } from './CreateLandingPageForm';
import styles from '../../../components/portal/portal-ui.module.css';

export default async function AdminLandingPagesPage() {
  const principal = await requireAdminPage();

  const pages = await prisma.landingPage.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Landing Pages</h1>
      </div>

      <div className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>URL</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pages.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={4}>No landing pages yet — create one below.</td>
                </tr>
              )}
              {pages.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td><span className={`${styles.badge} ${p.status === 'PUBLISHED' ? styles.badgeActive : styles.badgeMuted}`}>{p.status}</span></td>
                  <td>/lp/{p.slug}</td>
                  <td><Link href={`/admin/landing-pages/${p.id}`}>Manage</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Create a landing page</h2>
        <CreateLandingPageForm />
      </div>
    </PortalShell>
  );
}
