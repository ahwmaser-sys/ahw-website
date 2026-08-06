'use client';

import { changeOwnPassword } from '../../../lib/portal/actions/profile';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function ChangePasswordForm() {
  return (
    <ActionForm action={changeOwnPassword} submitLabel="Change password">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="currentPassword">Current password</label>
        <input className={styles.input} id="currentPassword" name="currentPassword" type="password" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="newPassword">New password</label>
        <input className={styles.input} id="newPassword" name="newPassword" type="password" minLength={10} required />
      </div>
    </ActionForm>
  );
}
