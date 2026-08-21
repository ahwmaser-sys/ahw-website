'use client';

import { useState } from 'react';
import { setAdCampaignStatusAction } from '../../../../lib/portal/actions/ads';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

// The one financially-significant action in this feature — changing a
// campaign to Active/Paused can push a real status change (and therefore
// real spend) to the connected platform. REVIEW → CONFIRM → EXECUTE per
// the brief: picking a new status (REVIEW) reveals a second step that
// requires typing the campaign's exact name back (CONFIRM) before the
// button that actually submits (EXECUTE) is usable — never a single
// click from "viewing the campaign" to "status changed."
export function AdCampaignStatusForm({ id, name, currentStatus }: { id: string; name: string; currentStatus: string }) {
  const [pendingStatus, setPendingStatus] = useState<string>(currentStatus);
  const [confirmText, setConfirmText] = useState('');
  const isChange = pendingStatus !== currentStatus;

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="pendingStatus">Status</label>
        <select className={styles.select} id="pendingStatus" value={pendingStatus} onChange={(e) => { setPendingStatus(e.target.value); setConfirmText(''); }}>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {isChange && (
        <ActionForm action={setAdCampaignStatusAction} submitLabel={`Confirm: set to ${pendingStatus}`} buttonClassName={pendingStatus === 'ARCHIVED' ? styles.buttonDanger : styles.button}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={pendingStatus} />
          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmName">
              Type the campaign name exactly to confirm: <strong>{name}</strong>
            </label>
            <input
              className={styles.input}
              id="confirmName"
              name="confirmName"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
            <p className={styles.hint}>
              If this campaign already exists on the platform, this also pauses/activates it there — not just
              locally. The name must match exactly or this is rejected.
            </p>
          </div>
        </ActionForm>
      )}
    </div>
  );
}
