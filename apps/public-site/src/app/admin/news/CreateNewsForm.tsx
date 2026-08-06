'use client';

import { createNewsPost } from '../../../lib/portal/actions/news';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function CreateNewsForm() {
  return (
    <ActionForm action={createNewsPost} submitLabel="Create draft">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">Title</label>
        <input className={styles.input} id="title" name="title" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="excerpt">Excerpt</label>
        <input className={styles.input} id="excerpt" name="excerpt" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="body">Body</label>
        <textarea className={styles.textarea} id="body" name="body" required />
      </div>
    </ActionForm>
  );
}
