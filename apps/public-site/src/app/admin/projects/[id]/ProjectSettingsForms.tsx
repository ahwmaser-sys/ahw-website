'use client';

import type { Office } from '@prisma/client';
import { updateProject, deleteProject } from '../../../../lib/portal/actions/projects';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

interface Props {
  projectId: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
  progressPercent: number;
  isSuperAdmin: boolean;
  officeId: string;
  offices: readonly Office[];
}

export function EditProjectForm({ projectId, name, description, status, progressPercent, isSuperAdmin, officeId, offices }: Props) {
  return (
    <>
      <ActionForm action={updateProject} submitLabel="Save changes">
        <input type="hidden" name="projectId" value={projectId} />
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">Project name</label>
            <input className={styles.input} id="name" name="name" defaultValue={name} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="status">Status</label>
            <select className={styles.select} id="status" name="status" defaultValue={status}>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="officeId">Office</label>
            <select className={styles.select} id="officeId" name="officeId" defaultValue={officeId} required>
              {offices.map((office) => (
                <option key={office.id} value={office.id}>{office.displayName}</option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="description">Description</label>
          <textarea className={styles.textarea} id="description" name="description" defaultValue={description ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="progressPercent">Progress (%)</label>
          <input
            className={styles.input}
            id="progressPercent"
            name="progressPercent"
            type="number"
            min={0}
            max={100}
            defaultValue={progressPercent}
            required
          />
        </div>
      </ActionForm>

      {isSuperAdmin && (
        <ActionForm action={deleteProject} submitLabel="Delete project" buttonClassName={styles.buttonDanger} className={styles.formSpacer}>
          <input type="hidden" name="projectId" value={projectId} />
          <p className={styles.cardMeta}>Deleting a project removes all its milestones, photos, documents, and messages. This cannot be undone.</p>
        </ActionForm>
      )}
    </>
  );
}
