'use client';

import { ActionForm } from '../../../components/portal/ActionForm';
import { syncGoogleReviews } from '../../../lib/portal/actions/reviews';
import styles from '../../../components/portal/portal-ui.module.css';

export function SyncReviewsForm({ officeId }: { officeId: string }) {
  return (
    <ActionForm action={syncGoogleReviews} submitLabel="Sync Google Reviews" pendingLabel="Syncing…" buttonClassName={styles.button}>
      <input type="hidden" name="officeId" value={officeId} />
    </ActionForm>
  );
}
