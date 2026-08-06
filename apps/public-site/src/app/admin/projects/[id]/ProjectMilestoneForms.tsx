'use client';

import { createMilestone, toggleMilestone } from '../../../../lib/portal/actions/projects';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export function AddMilestoneForm({ projectId }: { projectId: string }) {
  return (
    <ActionForm action={createMilestone} submitLabel="Add milestone">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="title">Title</label>
          <input className={styles.input} id="title" name="title" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="dueDate">Due date</label>
          <input className={styles.input} id="dueDate" name="dueDate" type="date" />
        </div>
      </div>
    </ActionForm>
  );
}

export function ToggleMilestoneButton({
  milestoneId,
  projectId,
  completed,
}: {
  milestoneId: string;
  projectId: string;
  completed: boolean;
}) {
  return (
    <ActionForm
      action={toggleMilestone}
      submitLabel={completed ? 'Mark incomplete' : 'Mark complete'}
      buttonClassName={styles.buttonSecondary}
      className={styles.buttonRow}
    >
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="completed" value={(!completed).toString()} />
    </ActionForm>
  );
}
