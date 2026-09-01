'use client';

import { hideSocialFeedPost, unhideSocialFeedPost } from '../../../lib/portal/actions/social';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function HideSocialFeedPostForm({ id }: { id: string }) {
  return (
    <ActionForm action={hideSocialFeedPost} submitLabel="Hide from website" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="id" value={id} />
    </ActionForm>
  );
}

export function UnhideSocialFeedPostForm({ id }: { id: string }) {
  return (
    <ActionForm action={unhideSocialFeedPost} submitLabel="Restore to website" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="id" value={id} />
    </ActionForm>
  );
}
