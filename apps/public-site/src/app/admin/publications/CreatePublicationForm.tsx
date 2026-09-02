'use client';

import { createPublication } from '../../../lib/portal/actions/publications';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function CreatePublicationForm() {
  return (
    <ActionForm action={createPublication} submitLabel="Create publication">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">Title</label>
        <input className={styles.input} id="title" name="title" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="outlet">Outlet</label>
        <input className={styles.input} id="outlet" name="outlet" placeholder="e.g. Forbes Middle East" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="url">Original feature URL</label>
        <input className={styles.input} id="url" name="url" type="url" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="date">Date</label>
        <input className={styles.input} id="date" name="date" type="date" required />
      </div>
    </ActionForm>
  );
}
