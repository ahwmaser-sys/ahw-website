import { requireSuperAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { ForceLogoutForm } from './ForceLogoutForm';
import { ChangePasswordForm } from './ChangePasswordForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export default async function AdminSecuritySettingsPage() {
  const principal = await requireSuperAdminPage();
  const activeSessions = await prisma.session.count({ where: { expiresAt: { gt: new Date() } } });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Security</h1>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Session policy</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <tbody>
              <tr><td>Active sessions</td><td>{activeSessions}</td></tr>
              <tr><td>Session lifetime</td><td>7 days, opaque token, hash-only storage</td></tr>
              <tr><td>Password hashing</td><td>Argon2id</td></tr>
              <tr><td>Minimum password length</td><td>10 characters</td></tr>
              <tr><td>CSRF protection</td><td>Double-submit cookie on every state-changing request</td></tr>
              <tr><td>Login rate limiting</td><td>10 attempts / 15 minutes per IP (Postgres-backed, multi-instance safe)</td></tr>
              <tr><td>AI generation rate limiting</td><td>20 requests / 15 minutes per staff account</td></tr>
              <tr><td>Credential encryption at rest</td><td>AES-256-GCM (Settings → Integrations)</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Change your password</h2>
        <ChangePasswordForm />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Incident response</h2>
        <ForceLogoutForm />
      </div>
    </PortalShell>
  );
}
