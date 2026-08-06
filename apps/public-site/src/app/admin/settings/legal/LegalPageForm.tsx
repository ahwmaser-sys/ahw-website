'use client';

import type { LegalPage } from '@prisma/client';
import { updateLegalPage } from '../../../../lib/portal/actions/legal-pages';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export function LegalPageForm({ page, route }: { page: LegalPage; route: string }) {
  return (
    <ActionForm action={updateLegalPage} submitLabel="Save changes">
      <input type="hidden" name="type" value={page.type} />
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`title-${page.type}`}>Title</label>
          <input className={styles.input} id={`title-${page.type}`} name="title" defaultValue={page.title} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Public URL</label>
          <input className={styles.input} value={route} disabled />
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`body-${page.type}`}>Body</label>
        <textarea className={styles.textarea} id={`body-${page.type}`} name="body" rows={16} defaultValue={page.body} required />
      </div>
    </ActionForm>
  );
}
