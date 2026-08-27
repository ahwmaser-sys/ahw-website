import Link from 'next/link';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import styles from '../../../components/portal/portal-ui.module.css';

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export default async function AdminMessagesPage() {
  const principal = await requireAdminPage();

  // One thread per project — reuses the same Message model each
  // project detail page already reads/writes; this is a cross-project
  // index into those same threads, not a separate inbox.
  const projects = await prisma.project.findMany({
    where: { messages: { some: {} } },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: { name: true, role: true } } } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Messages</h1>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Project</th>
              <th>Last message</th>
              <th>From</th>
              <th>When</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 && (
              <tr className={styles.emptyRow}>
                <td colSpan={6}>No project conversations yet.</td>
              </tr>
            )}
            {projects.map((project) => {
              const last = project.messages[0];
              return (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{last ? (last.body.length > 60 ? `${last.body.slice(0, 60)}…` : last.body) : '—'}</td>
                  <td>{last ? `${last.sender.name} (${last.sender.role})` : '—'}</td>
                  <td>{last ? formatDate(last.createdAt) : '—'}</td>
                  <td>{project._count.messages}</td>
                  <td>
                    <Link href={`/admin/projects/${project.id}`}>Manage</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}
