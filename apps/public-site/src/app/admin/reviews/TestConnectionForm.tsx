'use client';

import { ActionForm } from '../../../components/portal/ActionForm';
import { testGoogleReviewsConnectionAction } from '../../../lib/portal/actions/reviews';
import styles from '../../../components/portal/portal-ui.module.css';

export function TestConnectionForm({ officeId }: { officeId: string }) {
  return (
    <ActionForm action={testGoogleReviewsConnectionAction} submitLabel="Test Connection" pendingLabel="Testing…" buttonClassName={styles.buttonSecondary}>
      <input type="hidden" name="officeId" value={officeId} />
    </ActionForm>
  );
}
