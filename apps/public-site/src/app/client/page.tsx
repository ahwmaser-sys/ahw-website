import Link from 'next/link';
import { requireClientPage } from '../../lib/portal/page-guard';
import { prisma } from '../../lib/portal/db';
import { PortalShell } from '../../components/portal/PortalShell';
import { CLIENT_NAV_LINKS } from './nav-links';
import portalStyles from '../../components/portal/portal-ui.module.css';
import styles from './dashboard.module.css';

export default async function ClientDashboard() {
  const principal = await requireClientPage();

  const memberships = await prisma.projectMember.findMany({
    where: { userId: principal.userId },
    include: { project: true },
    orderBy: { project: { updatedAt: 'desc' } },
  });

  return (
    <PortalShell brand="AHW Client Portal" navLinks={CLIENT_NAV_LINKS} userLabel="Client">
      <h1 className={styles.title}>Your projects</h1>

      {memberships.length === 0 ? (
        <p className={portalStyles.cardMeta}>
          No projects have been assigned to your account yet. Your architect will notify you once your project is set up.
        </p>
      ) : (
        <div className={styles.projectGrid}>
          {memberships.map((membership) => (
            <Link key={membership.id} href={`/client/projects/${membership.project.id}`} className={styles.projectCard}>
              <span className={styles.projectName}>{membership.project.name}</span>
              <span className={styles.projectMeta}>{membership.project.status}</span>
              <div className={portalStyles.progressTrack} aria-hidden="true">
                <div className={portalStyles.progressFill} style={{ width: `${membership.project.progressPercent}%` }} />
              </div>
              <span className={styles.projectMeta}>{membership.project.progressPercent}% complete</span>
            </Link>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
