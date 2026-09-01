'use client';

import { hideSocialFeedPost, unhideSocialFeedPost, pinSocialFeedPost, unpinSocialFeedPost } from '../../../lib/portal/actions/social';
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

export function PinSocialFeedPostForm({ id }: { id: string }) {
  return (
    <ActionForm action={pinSocialFeedPost} submitLabel="Pin to top" buttonClassName={styles.button} className={styles.buttonRow}>
      <input type="hidden" name="id" value={id} />
    </ActionForm>
  );
}

export function UnpinSocialFeedPostForm({ id }: { id: string }) {
  return (
    <ActionForm action={unpinSocialFeedPost} submitLabel="Unpin" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="id" value={id} />
    </ActionForm>
  );
}
