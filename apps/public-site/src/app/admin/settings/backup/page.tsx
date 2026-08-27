import { requireSuperAdminPage } from '../../../../lib/portal/page-guard';
import { listBackups, isUsingBlobStorage } from '../../../../lib/portal/backup';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { CreateBackupForm, ValidateBackupForm, RestoreBackupForm, DeleteBackupForm } from './BackupForms';
import styles from '../../../../components/portal/portal-ui.module.css';

export default async function AdminBackupPage() {
  const principal = await requireSuperAdminPage();
  const usingBlob = isUsingBlobStorage();

  // Without Blob configured, this falls back to local disk — which
  // doesn't exist to write to at all on Vercel's read-only deployment
  // filesystem (confirmed live: mkdir ENOENT on /var/task/...). Caught
  // here so a misconfigured environment shows the warning below instead
  // of a hard 500; the underlying functions still throw for any other
  // (real) error, which is what CreateBackupForm's error message needs.
  let backups: Awaited<ReturnType<typeof listBackups>> = [];
  let listError: string | null = null;
  try {
    backups = await listBackups();
  } catch (error) {
    listError = error instanceof Error ? error.message : 'Could not read backup storage.';
  }

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
          BLOB_READ_WRITE_TOKEN isn&apos;t set in this environment. On Vercel, that means Create/Restore cannot work at
          all (there is no writable local disk to fall back to) — connect a Blob store to this project from the
          Vercel dashboard&apos;s Storage tab first, which sets this automatically.
        </p>
      )}
      {listError && (
        <p className={styles.errorMessage} role="alert">{listError}</p>
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
              {backups.length === 0 && !listError && (
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
