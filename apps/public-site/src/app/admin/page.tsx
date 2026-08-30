import Link from 'next/link';
import { requireAdminPage } from '../../lib/portal/page-guard';
import { prisma } from '../../lib/portal/db';
import { PortalShell } from '../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from './nav-links';
import { runHealthChecks, type HealthStatus } from '../../lib/portal/system-health';
import styles from './dashboard.module.css';
import portalStyles from '../../components/portal/portal-ui.module.css';

const HEALTH_BADGE_CLASS: Record<HealthStatus, string> = {
  HEALTHY: 'badgeActive',
  WARNING: 'badgeWarn',
  OFFLINE: 'badgeDanger',
};

export default async function AdminDashboard() {
  const principal = await requireAdminPage();

  const [
    clientCount,
    projectCount,
    activeProjectCount,
    newsCount,
    draftNewsCount,
    newEnquiryCount,
    totalEnquiryCount,
    failedSocialCount,
    residentialCount,
    recentEnquiries,
    recentActivity,
    healthChecks,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.project.count(),
    prisma.project.count({ where: { status: 'ACTIVE' } }),
    prisma.newsPost.count(),
    prisma.newsPost.count({ where: { status: 'DRAFT' } }),
    prisma.enquiry.count({ where: { status: 'New' } }),
    prisma.enquiry.count(),
    prisma.socialPost.count({ where: { status: 'FAILED' } }),
    prisma.residentialExperience.count(),
    prisma.enquiry.findMany({
      where: { status: 'New' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, projectType: true, createdAt: true },
    }),
    prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
    runHealthChecks(),
  ]);

  // Vercel injects these automatically at build time — real values when
  // this is actually running on Vercel, absent (and honestly reported
  // as such) in any other environment rather than showing a fabricated
  // "unknown" version.
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA;
  const environment = process.env.VERCEL_ENV;

  const attentionItems = [
    { label: 'New enquiries', count: newEnquiryCount, href: '/admin/enquiries' },
    { label: 'Draft articles', count: draftNewsCount, href: '/admin/news' },
    { label: 'Failed social posts', count: failedSocialCount, href: '/admin/news' },
  ].filter((item) => item.count > 0);

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <h1 className={styles.title}>Dashboard</h1>

      <div className={portalStyles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={`${portalStyles.sectionTitle} ${styles.sectionHeaderTitle}`}>System Health</h2>
          <Link href="/admin/settings/system" className={portalStyles.backLink}>View details →</Link>
        </div>
        <div className={styles.healthGrid}>
          {healthChecks.map((check) => (
            <div key={check.name} className={styles.healthRow}>
              <span className={`${portalStyles.badge} ${portalStyles[HEALTH_BADGE_CLASS[check.status]]}`}>{check.status}</span>
              <span className={styles.healthName}>{check.name}</span>
            </div>
          ))}
        </div>
        <p className={portalStyles.hint}>
          {commitSha ? `Running commit ${commitSha.slice(0, 7)}${environment ? ` · ${environment}` : ''}.` : 'Deployment version not available in this environment.'}
        </p>
      </div>

      <div className={portalStyles.section}>
        <h2 className={portalStyles.sectionTitle}>Requires Attention</h2>
        {attentionItems.length === 0 ? (
          <p className={portalStyles.cardMeta}>Nothing needs attention right now.</p>
        ) : (
          <div className={styles.statsGrid}>
            {attentionItems.map((item) => (
              <Link key={item.label} href={item.href} className={styles.statCard}>
                <span className={styles.statValue}>{item.count}</span>
                <span className={styles.statLabel}>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className={portalStyles.section}>
        <h2 className={portalStyles.sectionTitle}>Business Snapshot</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{totalEnquiryCount}</span>
            <span className={styles.statLabel}>Enquiries</span>
          </div>
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
            <span className={styles.statLabel}>Articles</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{residentialCount}</span>
            <span className={styles.statLabel}>Residential Communities</span>
          </div>
        </div>
      </div>

      {recentEnquiries.length > 0 && (
        <div className={portalStyles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={`${portalStyles.sectionTitle} ${styles.sectionHeaderTitle}`}>Recent Enquiries</h2>
            <Link href="/admin/enquiries" className={portalStyles.backLink}>View all →</Link>
          </div>
          <div className={portalStyles.tableWrap}>
            <table className={portalStyles.table}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Name</th>
                  <th>Project type</th>
                </tr>
              </thead>
              <tbody>
                {recentEnquiries.map((enquiry) => (
                  <tr key={enquiry.id}>
                    <td>{enquiry.createdAt.toLocaleString()}</td>
                    <td>{enquiry.name}</td>
                    <td>{enquiry.projectType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={portalStyles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={`${portalStyles.sectionTitle} ${styles.sectionHeaderTitle}`}>Recent Activity</h2>
          <Link href="/admin/activity" className={portalStyles.backLink}>View all →</Link>
        </div>
        <div className={portalStyles.tableWrap}>
          <table className={portalStyles.table}>
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 && (
                <tr className={portalStyles.emptyRow}>
                  <td colSpan={3}>No activity recorded yet.</td>
                </tr>
              )}
              {recentActivity.map((log) => (
                <tr key={log.id}>
                  <td>{log.createdAt.toLocaleString()}</td>
                  <td>{log.action}</td>
                  <td>{log.actorEmail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}
