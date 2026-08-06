import { requireAdminPage } from '../../lib/portal/page-guard';
import { prisma } from '../../lib/portal/db';
import { PortalShell } from '../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from './nav-links';
import styles from './dashboard.module.css';

export default async function AdminDashboard() {
  const principal = await requireAdminPage();

  const [clientCount, projectCount, activeProjectCount, newsCount] = await Promise.all([
    prisma.client.count(),
    prisma.project.count(),
    prisma.project.count({ where: { status: 'ACTIVE' } }),
    prisma.newsPost.count(),
  ]);

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <h1 className={styles.title}>Dashboard</h1>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{clientCount}</span>
          <span className={styles.statLabel}>Clients</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{projectCount}</span>
          <span className={styles.statLabel}>Total Projects</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{activeProjectCount}</span>
          <span className={styles.statLabel}>Active Projects</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{newsCount}</span>
          <span className={styles.statLabel}>News Posts</span>
        </div>
      </div>
    </PortalShell>
  );
}
