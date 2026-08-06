'use client';

import { useState } from 'react';
import { forceLogoutEverywhere } from '../../../../lib/portal/actions/security';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

// Two-step reveal, same pattern as Backup & Restore's restore
// confirmation — this doesn't destroy data (everyone can just log back
// in), but it's a one-click action that disrupts every staff member and
// client at once, including the person clicking it, so it shouldn't be
// a single accidental click away.
export function ForceLogoutForm() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <div>
        <p className={styles.cardMeta}>Revokes every active session, staff and clients alike, including your own. Use if a credential may be compromised.</p>
        <button type="button" className={styles.buttonDanger} onClick={() => setConfirming(true)}>
          Force logout everywhere
        </button>
      </div>
    );
  }

  return (
    <ActionForm action={forceLogoutEverywhere} submitLabel="Confirm — log everyone out now" pendingLabel="Revoking…" buttonClassName={styles.buttonDanger}>
      <p className={styles.cardMeta}>This cannot be undone — everyone will need to sign in again, including you.</p>
    </ActionForm>
  );
}
