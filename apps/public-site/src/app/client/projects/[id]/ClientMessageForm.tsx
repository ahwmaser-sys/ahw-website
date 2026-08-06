'use client';

import { sendClientMessage } from '../../../../lib/portal/actions/client-messages';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export function ClientMessageForm({ projectId }: { projectId: string }) {
  return (
    <ActionForm action={sendClientMessage} submitLabel="Send" pendingLabel="Sending…">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="clientMessageBody">Send a message</label>
        <textarea className={styles.textarea} id="clientMessageBody" name="body" required />
      </div>
    </ActionForm>
  );
}
