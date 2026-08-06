'use client';

import { createLandingPage } from '../../../lib/portal/actions/landing-pages';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function CreateLandingPageForm() {
  return (
    <ActionForm action={createLandingPage} submitLabel="Create landing page">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">Title</label>
        <input className={styles.input} id="title" name="title" required />
      </div>
    </ActionForm>
  );
}
