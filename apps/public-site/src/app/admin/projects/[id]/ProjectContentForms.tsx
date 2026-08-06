'use client';

import { postProjectUpdate } from '../../../../lib/portal/actions/projects';
import { replyToProjectMessage, deleteMessage } from '../../../../lib/portal/actions/messages';
import { sendProjectNotification } from '../../../../lib/portal/actions/notifications';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export function PostUpdateForm({ projectId }: { projectId: string }) {
  return (
    <ActionForm action={postProjectUpdate} submitLabel="Post update">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="updateBody">What's new</label>
        <textarea className={styles.textarea} id="updateBody" name="body" required />
      </div>
    </ActionForm>
  );
}

export function DeleteMessageForm({ messageId, projectId }: { messageId: string; projectId: string }) {
  return (
    <ActionForm action={deleteMessage} submitLabel="Delete" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="messageId" value={messageId} />
      <input type="hidden" name="projectId" value={projectId} />
    </ActionForm>
  );
}

export function ReplyMessageForm({ projectId }: { projectId: string }) {
  return (
    <ActionForm action={replyToProjectMessage} submitLabel="Send" pendingLabel="Sending…">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="messageBody">Reply</label>
        <textarea className={styles.textarea} id="messageBody" name="body" required />
      </div>
    </ActionForm>
  );
}

export function SendNotificationForm({ projectId }: { projectId: string }) {
  return (
    <ActionForm action={sendProjectNotification} submitLabel="Send notification">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="notifTitle">Title</label>
        <input className={styles.input} id="notifTitle" name="title" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="notifBody">Message</label>
        <textarea className={styles.textarea} id="notifBody" name="body" required />
      </div>
    </ActionForm>
  );
}
