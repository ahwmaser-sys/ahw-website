'use client';

import type { Office } from '@prisma/client';
import { updateClient, setClientUserStatus, resetClientPassword, archiveClient, restoreClient, deleteClient } from '../../../../lib/portal/actions/clients';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export function UpdateClientForm({
  clientId,
  companyName,
  officeId,
  offices,
}: {
  clientId: string;
  companyName: string;
  officeId: string;
  offices: readonly Office[];
}) {
  return (
    <ActionForm action={updateClient} submitLabel="Save changes">
      <input type="hidden" name="clientId" value={clientId} />
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="companyName">Company name</label>
          <input className={styles.input} id="companyName" name="companyName" defaultValue={companyName} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="officeId">Office</label>
          <select className={styles.select} id="officeId" name="officeId" defaultValue={officeId} required>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>{office.displayName}</option>
            ))}
          </select>
        </div>
      </div>
    </ActionForm>
  );
}

export function ToggleClientStatusForm({
  userId,
  clientId,
  currentStatus,
}: {
  userId: string;
  clientId: string;
  currentStatus: 'ACTIVE' | 'DISABLED';
}) {
  const nextStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  return (
    <ActionForm
      action={setClientUserStatus}
      submitLabel={nextStatus === 'DISABLED' ? 'Disable account' : 'Re-enable account'}
      buttonClassName={nextStatus === 'DISABLED' ? styles.buttonDanger : styles.buttonSecondary}
      className={styles.buttonRow}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="status" value={nextStatus} />
    </ActionForm>
  );
}

export function ArchiveClientForm({ clientId }: { clientId: string }) {
  return (
    <ActionForm action={archiveClient} submitLabel="Archive client" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="clientId" value={clientId} />
    </ActionForm>
  );
}

export function RestoreClientForm({ clientId }: { clientId: string }) {
  return (
    <ActionForm action={restoreClient} submitLabel="Restore client" className={styles.buttonRow}>
      <input type="hidden" name="clientId" value={clientId} />
    </ActionForm>
  );
}

export function DeleteClientForm({ clientId }: { clientId: string }) {
  return (
    <ActionForm action={deleteClient} submitLabel="Delete permanently" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="clientId" value={clientId} />
    </ActionForm>
  );
}

export function ResetClientPasswordForm({ userId, clientId }: { userId: string; clientId: string }) {
  return (
    <ActionForm action={resetClientPassword} submitLabel="Set new password">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="clientId" value={clientId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="newPassword">New password</label>
        <input className={styles.input} id="newPassword" name="newPassword" type="text" minLength={10} required />
      </div>
    </ActionForm>
  );
}
