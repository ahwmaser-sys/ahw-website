'use client';

import { markNotificationRead } from '../../../lib/portal/actions/profile';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function MarkReadButton({ notificationId }: { notificationId: string }) {
  return (
    <ActionForm action={markNotificationRead} submitLabel="Mark as read" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="notificationId" value={notificationId} />
    </ActionForm>
  );
}
