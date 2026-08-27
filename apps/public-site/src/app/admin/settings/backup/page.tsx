import { requireSuperAdminPage } from '../../../../lib/portal/page-guard';
import { listBackups, isUsingBlobStorage } from '../../../../lib/portal/backup';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { CreateBackupForm, ValidateBackupForm, RestoreBackupForm, DeleteBackupForm } from './BackupForms';
import styles from '../../../../components/portal/portal-ui.module.css';

export default async function AdminBackupPage() {
  const principal = await requireSuperAdminPage();
  const [backups, usingBlob] = await Promise.all([listBackups(), Promise.resolve(isUsingBlobStorage())]);

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Backup & Restore</h1>
      </div>
      <p className={styles.subtitle}>
        A full export of every table, as JSON, stored in {usingBlob ? 'Vercel Blob storage' : "this server's local disk — only durable in local development, not in production"}.
        Restore is transaction-wrapped — if anything fails partway, nothing changes.
      </p>
      {!usingBlob && (
        <p className={styles.errorMessage} role="alert">
          BLOB_READ_WRITE_TOKEN isn&apos;t set in this environment — backups created here will not survive between requests. Connect Vercel Blob storage to this project before relying on backups.
        </p>
      )}

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
                      <DeleteBackupForm fileName={b.fileName} />
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
