import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireSuperAdminPage } from '../../../../../lib/portal/page-guard';
import { prisma } from '../../../../../lib/portal/db';
import { PortalShell } from '../../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../../nav-links';
import { ProfileForm } from '../../../profile/ProfileForm';
import styles from '../../../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminStaffUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireSuperAdminPage();
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/settings/users" className={styles.backLink}>← All users</Link>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{user.name}</h1>
        <span className={styles.badge}>{user.role.replace('_', ' ')}</span>
      </div>
      <p className={styles.subtitle}>{user.email}</p>

      <div className={styles.section}>
        <ProfileForm userId={user.id} name={user.name} phone={user.phone} jobTitle={user.jobTitle} avatarId={user.avatarId} />
      </div>
    </PortalShell>
  );
}
