import type { Metadata } from 'next';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { ProfileForm } from './ProfileForm';
import styles from '../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminMyProfilePage() {
  const principal = await requireAdminPage();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: principal.userId } });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>My Profile</h1>
      </div>
      <p className={styles.subtitle}>Your byline photo and job title appear automatically on every article you author.</p>

      <div className={styles.section}>
        <ProfileForm userId={user.id} name={user.name} phone={user.phone} jobTitle={user.jobTitle} avatarId={user.avatarId} />
      </div>
    </PortalShell>
  );
}
