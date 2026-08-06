import Link from 'next/link';
import { requireSuperAdminPage } from '../../../../../lib/portal/page-guard';
import { prisma } from '../../../../../lib/portal/db';
import { PortalShell } from '../../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../../nav-links';
import styles from '../../../../../components/portal/portal-ui.module.css';

// A minimal, real activity log filtered to one integration (company-wide
// entries use entityId = "TYPE"; per-office entries use "TYPE:officeId",
// matching how the connect/disconnect/test actions record them) — not a
// fabricated log viewer, the same ActivityLog table every other admin
// mutation already writes to.
export default async function IntegrationLogsPage({ searchParams }: { searchParams: Promise<{ entityId?: string }> }) {
  const principal = await requireSuperAdminPage();
  const { entityId } = await searchParams;

  const logs = entityId
    ? await prisma.activityLog.findMany({
        where: { entityType: 'IntegrationConfig', entityId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    : [];

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/settings/integrations" className={styles.backLink}>← Integrations</Link>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Logs — {entityId ?? 'Unknown'}</h1>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr className={styles.emptyRow}>
                <td colSpan={4}>No activity recorded for this integration yet.</td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.createdAt.toLocaleString()}</td>
                <td>{log.action}</td>
                <td>{log.actorEmail ?? '—'}</td>
                <td>{log.metadata ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}
