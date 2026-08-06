import Link from 'next/link';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { getActiveOffices } from '../../../lib/portal/offices';
import { CreateProjectForm } from './CreateProjectForm';
import styles from '../../../components/portal/portal-ui.module.css';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badgeActive',
  ON_HOLD: 'badgeWarn',
  COMPLETED: 'badgeMuted',
};

export default async function AdminProjectsPage() {
  const principal = await requireAdminPage();

  const [projects, offices] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { members: { include: { client: true } } },
    }),
    getActiveOffices(),
  ]);

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Projects</h1>
      </div>

      <div className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Project</th>
                <th>Client(s)</th>
                <th>Status</th>
                <th>Progress</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={5}>No projects yet — create one below.</td>
                </tr>
              )}
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{project.members.map((m) => m.client?.companyName).filter(Boolean).join(', ') || '—'}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[STATUS_BADGE[project.status] ?? 'badgeMuted']}`}>{project.status}</span>
                  </td>
                  <td>{project.progressPercent}%</td>
                  <td>
                    <Link href={`/admin/projects/${project.id}`}>Manage</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Create a project</h2>
        <CreateProjectForm offices={offices} />
      </div>
    </PortalShell>
  );
}
