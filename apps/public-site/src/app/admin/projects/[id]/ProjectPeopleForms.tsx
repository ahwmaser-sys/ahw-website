'use client';

import { assignClientToProject, removeMemberFromProject } from '../../../../lib/portal/actions/projects';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

interface ClientOption {
  id: string;
  companyName: string;
}

export function AssignClientForm({ projectId, clients }: { projectId: string; clients: ClientOption[] }) {
  if (clients.length === 0) {
    return <p className={styles.cardMeta}>Every client is already assigned, or none exist yet.</p>;
  }
  return (
    <ActionForm action={assignClientToProject} submitLabel="Assign">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="clientId">Client</label>
        <select className={styles.select} id="clientId" name="clientId" required>
          <option value="">Select a client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.companyName}</option>
          ))}
        </select>
      </div>
    </ActionForm>
  );
}

export function RemoveMemberButton({ membershipId, projectId }: { membershipId: string; projectId: string }) {
  return (
    <ActionForm action={removeMemberFromProject} submitLabel="Remove" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="membershipId" value={membershipId} />
      <input type="hidden" name="projectId" value={projectId} />
    </ActionForm>
  );
}
