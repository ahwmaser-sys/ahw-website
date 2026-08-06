'use client';

import { createCampaign } from '../../../lib/portal/actions/campaigns';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function CreateCampaignForm() {
  return (
    <ActionForm action={createCampaign} submitLabel="Create campaign">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">Name</label>
        <input className={styles.input} id="name" name="name" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">Description</label>
        <textarea className={styles.textarea} id="description" name="description" />
      </div>
    </ActionForm>
  );
}
