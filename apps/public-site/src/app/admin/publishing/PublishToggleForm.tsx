'use client';

import { togglePublishingDestination } from '../../../lib/portal/actions/publishing-destinations';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function PublishToggleForm({ officeId, platform, isEnabled }: { officeId: string; platform: string; isEnabled: boolean }) {
  return (
    <ActionForm
      action={togglePublishingDestination}
      submitLabel={isEnabled ? 'Disable' : 'Enable'}
      buttonClassName={isEnabled ? styles.buttonSecondary : styles.button}
      className={styles.buttonRow}
    >
      <input type="hidden" name="officeId" value={officeId} />
      <input type="hidden" name="platform" value={platform} />
      <input type="hidden" name="isEnabled" value={(!isEnabled).toString()} />
    </ActionForm>
  );
}
