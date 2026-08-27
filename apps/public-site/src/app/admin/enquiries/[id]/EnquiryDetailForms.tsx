'use client';

import { archiveEnquiry, restoreEnquiry, deleteEnquiry } from '../../../../lib/portal/actions/enquiries';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export function ArchiveEnquiryForm({ enquiryId }: { enquiryId: string }) {
  return (
    <ActionForm action={archiveEnquiry} submitLabel="Archive" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="enquiryId" value={enquiryId} />
    </ActionForm>
  );
}

export function RestoreEnquiryForm({ enquiryId }: { enquiryId: string }) {
  return (
    <ActionForm action={restoreEnquiry} submitLabel="Restore" className={styles.buttonRow}>
      <input type="hidden" name="enquiryId" value={enquiryId} />
    </ActionForm>
  );
}

export function DeleteEnquiryForm({ enquiryId }: { enquiryId: string }) {
  return (
    <ActionForm action={deleteEnquiry} submitLabel="Delete permanently" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="enquiryId" value={enquiryId} />
    </ActionForm>
  );
}
