'use client';

import { inviteStaffUser, setStaffUserStatus, sendStaffPasswordReset } from '../../../../lib/portal/actions/staff-users';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export function InviteStaffForm() {
  return (
    <ActionForm action={inviteStaffUser} submitLabel="Send invite">
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="staff-email">Email</label>
          <input className={styles.input} id="staff-email" name="email" type="email" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="staff-name">Name</label>
          <input className={styles.input} id="staff-name" name="name" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="staff-role">Role</label>
          <select className={styles.select} id="staff-role" name="role" defaultValue="EDITOR">
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
      </div>
    </ActionForm>
  );
}

export function SendPasswordResetForm({ userId }: { userId: string }) {
  return (
    <ActionForm action={sendStaffPasswordReset} submitLabel="Send password reset link" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="userId" value={userId} />
    </ActionForm>
  );
}

export function StaffStatusForm({ userId, status }: { userId: string; status: 'ACTIVE' | 'DISABLED' }) {
  const nextStatus = status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  return (
    <ActionForm
      action={setStaffUserStatus}
      submitLabel={status === 'ACTIVE' ? 'Disable' : 'Enable'}
      buttonClassName={status === 'ACTIVE' ? styles.buttonDanger : styles.buttonSecondary}
      className={styles.buttonRow}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={nextStatus} />
    </ActionForm>
  );
}
