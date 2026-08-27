'use client';

import { useState } from 'react';
import { createBackupAction, validateBackupAction, restoreBackupAction, deleteBackupAction } from '../../../../lib/portal/actions/backup';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export function CreateBackupForm() {
  return (
    <ActionForm action={createBackupAction} submitLabel="Create Backup" pendingLabel="Backing up…">
      <p className={styles.cardMeta}>A full logical export of every table, as JSON — restorable through this same panel.</p>
    </ActionForm>
  );
}

export function ValidateBackupForm({ fileName }: { fileName: string }) {
  return (
    <ActionForm action={validateBackupAction} submitLabel="Validate" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="fileName" value={fileName} />
    </ActionForm>
  );
}

export function RestoreBackupForm({ fileName }: { fileName: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className={styles.buttonDanger} onClick={() => setConfirming(true)}>
        Restore
      </button>
    );
  }

  return (
    <ActionForm action={restoreBackupAction} submitLabel="Confirm Restore" pendingLabel="Restoring…" buttonClassName={styles.buttonDanger}>
      <input type="hidden" name="fileName" value={fileName} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`confirm-${fileName}`}>
          This replaces every current row with the backup&apos;s data. Type <strong>RESTORE</strong> to confirm.
        </label>
        <input className={styles.input} id={`confirm-${fileName}`} name="confirmation" placeholder="RESTORE" required />
      </div>
    </ActionForm>
  );
}

export function DeleteBackupForm({ fileName }: { fileName: string }) {
  return (
    <ActionForm action={deleteBackupAction} submitLabel="Delete" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="fileName" value={fileName} />
    </ActionForm>
  );
}
