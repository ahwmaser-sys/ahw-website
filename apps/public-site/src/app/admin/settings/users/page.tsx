import { requireSuperAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { InviteStaffForm, StaffStatusForm } from './StaffUserForms';
import styles from '../../../../components/portal/portal-ui.module.css';

export default async function AdminStaffUsersPage() {
  const principal = await requireSuperAdminPage();

  const staff = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] } },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Users</h1>
      </div>
      <p className={styles.subtitle}>Staff accounts — client accounts are managed separately under Clients.</p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Invite a staff member</h2>
        <InviteStaffForm />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Staff</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role.replace('_', ' ')}</td>
                  <td>
                    <span className={`${styles.badge} ${u.status === 'ACTIVE' ? styles.badgeActive : styles.badgeDanger}`}>{u.status}</span>
                  </td>
                  <td>{u.id !== principal.userId && <StaffStatusForm userId={u.id} status={u.status} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}
