'use client';

import type { Office } from '@prisma/client';
import { createProject } from '../../../lib/portal/actions/projects';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function CreateProjectForm({ offices }: { offices: readonly Office[] }) {
  return (
    <ActionForm action={createProject} submitLabel="Create project">
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Project name</label>
          <input className={styles.input} id="name" name="name" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="officeId">Office</label>
          <select className={styles.select} id="officeId" name="officeId" required defaultValue="">
            <option value="" disabled>Select an office…</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>{office.displayName}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">Description</label>
        <textarea className={styles.textarea} id="description" name="description" />
      </div>
    </ActionForm>
  );
}
