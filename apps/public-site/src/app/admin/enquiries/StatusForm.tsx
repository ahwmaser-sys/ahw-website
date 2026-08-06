'use client';

import { updateEnquiryStatus } from '../../../lib/portal/actions/enquiries';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function StatusForm({ enquiryId, status }: { enquiryId: string; status: string }) {
  return (
    <ActionForm action={updateEnquiryStatus} submitLabel="Save" className={styles.buttonRow}>
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <select className={styles.select} name="status" defaultValue={status}>
        <option value="New">New</option>
        <option value="Contacted">Contacted</option>
        <option value="Closed">Closed</option>
      </select>
    </ActionForm>
  );
}
