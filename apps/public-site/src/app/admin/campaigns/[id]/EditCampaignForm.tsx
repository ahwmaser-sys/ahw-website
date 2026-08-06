'use client';

import { updateCampaign } from '../../../../lib/portal/actions/campaigns';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

interface Props {
  campaignId: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

export function EditCampaignForm({ campaignId, name, description, status, startDate, endDate }: Props) {
  return (
    <ActionForm action={updateCampaign} submitLabel="Save campaign">
      <input type="hidden" name="campaignId" value={campaignId} />
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Name</label>
          <input className={styles.input} id="name" name="name" defaultValue={name} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="status">Status</label>
          <select className={styles.select} id="status" name="status" defaultValue={status}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">Description</label>
        <textarea className={styles.textarea} id="description" name="description" defaultValue={description ?? ''} />
      </div>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="startDate">Start date</label>
          <input className={styles.input} id="startDate" name="startDate" type="date" defaultValue={startDate ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="endDate">End date</label>
          <input className={styles.input} id="endDate" name="endDate" type="date" defaultValue={endDate ?? ''} />
        </div>
      </div>
    </ActionForm>
  );
}
