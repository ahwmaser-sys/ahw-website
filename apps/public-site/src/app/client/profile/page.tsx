import type { Metadata } from 'next';
import { requireClientPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { CLIENT_NAV_LINKS } from '../nav-links';
import { ChangePasswordForm } from './ChangePasswordForm';
import styles from '../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ClientProfilePage() {
  const principal = await requireClientPage();

  const user = await prisma.user.findUnique({
    where: { id: principal.userId },
    include: { client: true },
  });

  if (!user) {
    return null;
  }

  return (
    <PortalShell brand="AHW Client Portal" navLinks={CLIENT_NAV_LINKS} userLabel="Client">
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Profile</h1>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <div className={styles.card}>
          <span className={styles.cardMeta}>Name</span>
          <strong>{user.name}</strong>
          <span className={styles.cardMeta}>Email</span>
          <strong>{user.email}</strong>
          {user.client && (
            <>
              <span className={styles.cardMeta}>Company</span>
              <strong>{user.client.companyName}</strong>
            </>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Change password</h2>
        <ChangePasswordForm />
      </div>
    </PortalShell>
  );
}
