import Link from 'next/link';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { getActiveOffices } from '../../../lib/portal/offices';
import { CreateClientForm } from './CreateClientForm';
import styles from '../../../components/portal/portal-ui.module.css';

export default async function AdminClientsPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const principal = await requireAdminPage();
  const { archived } = await searchParams;
  const showArchived = archived === '1';

  const [clients, offices] = await Promise.all([
    prisma.client.findMany({
      where: { archivedAt: showArchived ? { not: null } : null },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, status: true } }, memberships: true },
    }),
    getActiveOffices(),
  ]);

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Clients</h1>
        <Link href={showArchived ? '/admin/clients' : '/admin/clients?archived=1'} className={styles.linkButton}>
          {showArchived ? '← Back to clients' : 'View archived'}
        </Link>
      </div>

      <div className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact email</th>
                <th>Status</th>
                <th>Projects</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={5}>No clients yet — add one below.</td>
                </tr>
              )}
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.companyName}</td>
                  <td>{client.user?.email ?? '—'}</td>
                  <td>
                    {client.user ? (
                      <span className={`${styles.badge} ${client.user.status === 'ACTIVE' ? styles.badgeActive : styles.badgeDanger}`}>
                        {client.user.status}
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeMuted}`}>No login</span>
                    )}
                  </td>
                  <td>{client.memberships.length}</td>
                  <td>
                    <Link href={`/admin/clients/${client.id}`}>Manage</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Add a client</h2>
        <CreateClientForm offices={offices} />
      </div>
    </PortalShell>
  );
}
