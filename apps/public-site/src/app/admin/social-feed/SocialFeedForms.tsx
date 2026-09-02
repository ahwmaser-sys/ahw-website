'use client';

import {
  hideSocialFeedPost,
  unhideSocialFeedPost,
  pinSocialFeedPost,
  unpinSocialFeedPost,
  linkSocialFeedPostToProject,
  unlinkSocialFeedPostFromProject,
} from '../../../lib/portal/actions/social';
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

export function LinkProjectForm({ id, projectOptions }: { id: string; projectOptions: { id: string; title: string }[] }) {
  return (
    <ActionForm action={linkSocialFeedPostToProject} submitLabel="Link" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="id" value={id} />
      <select name="projectId" required defaultValue="">
        <option value="" disabled>
          Link to project…
        </option>
        {projectOptions.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
    </ActionForm>
  );
}

export function UnlinkProjectForm({ id }: { id: string }) {
  return (
    <ActionForm action={unlinkSocialFeedPostFromProject} submitLabel="Unlink" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="id" value={id} />
    </ActionForm>
  );
}
