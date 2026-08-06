import { requireSuperAdminPage } from '../../../../lib/portal/page-guard';
import { listBackups } from '../../../../lib/portal/backup';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { CreateBackupForm, ValidateBackupForm, RestoreBackupForm } from './BackupForms';
import styles from '../../../../components/portal/portal-ui.module.css';

export default async function AdminBackupPage() {
  const principal = await requireSuperAdminPage();
  const backups = await listBackups();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Backup & Restore</h1>
      </div>
      <p className={styles.subtitle}>
        A full export of every table, stored as JSON on the server (outside the public web root). Restore is
        transaction-wrapped — if anything fails partway, nothing changes.
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Create backup</h2>
        <CreateBackupForm />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Backup history</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>File</th>
                <th>Size</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={4}>No backups yet.</td>
                </tr>
              )}
              {backups.map((b) => (
                <tr key={b.fileName}>
                  <td>{b.fileName}</td>
                  <td>{(b.sizeBytes / 1024).toFixed(0)} KB</td>
                  <td>{b.createdAt.toLocaleString()}</td>
                  <td>
                    <div className={styles.buttonRow}>
                      <a href={`/api/portal/backup-download?file=${encodeURIComponent(b.fileName)}`} className={styles.linkButton}>
                        Download
                      </a>
                      <ValidateBackupForm fileName={b.fileName} />
                      <RestoreBackupForm fileName={b.fileName} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}
