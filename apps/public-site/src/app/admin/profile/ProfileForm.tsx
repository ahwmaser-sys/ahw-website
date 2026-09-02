'use client';

import { updateUserProfile, setUserAvatar, clearUserAvatar } from '../../../lib/portal/actions/user-profile';
import { ActionForm } from '../../../components/portal/ActionForm';
import { MediaThumbnail } from '../../../components/portal/MediaThumbnail';
import styles from '../../../components/portal/portal-ui.module.css';

// Shared by /admin/profile (self-service, any staff role) and
// /admin/settings/users/[id] (SUPER_ADMIN editing someone else) — the
// three server actions branch on whether userId matches the caller's
// own id, so this one component works for both surfaces unchanged.
export function ProfileForm({
  userId,
  name,
  phone,
  jobTitle,
  avatarId,
}: {
  userId: string;
  name: string;
  phone: string | null;
  jobTitle: string | null;
  avatarId: string | null;
}) {
  return (
    <div className={styles.cardList}>
      <div className={styles.card}>
        <strong>Byline photo</strong>
        <p className={styles.cardMeta}>Shown next to every article this account authors.</p>
        {avatarId ? (
          <MediaThumbnail assetId={avatarId} alt={name} />
        ) : (
          <p className={styles.cardMeta}>No photo set — articles show initials instead.</p>
        )}
        <ActionForm action={setUserAvatar} submitLabel="Upload photo" pendingLabel="Uploading…" className={styles.formSpacer}>
          <input type="hidden" name="userId" value={userId} />
          <input type="file" name="file" accept="image/*" required />
        </ActionForm>
        {avatarId && (
          <ActionForm action={clearUserAvatar} submitLabel="Remove photo" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
            <input type="hidden" name="userId" value={userId} />
          </ActionForm>
        )}
      </div>

      <div className={styles.card}>
        <strong>Details</strong>
        <ActionForm action={updateUserProfile} submitLabel="Save">
          <input type="hidden" name="userId" value={userId} />
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`name-${userId}`}>Name</label>
              <input className={styles.input} id={`name-${userId}`} name="name" defaultValue={name} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`jobTitle-${userId}`}>Job title</label>
              <input
                className={styles.input}
                id={`jobTitle-${userId}`}
                name="jobTitle"
                defaultValue={jobTitle ?? ''}
                placeholder="e.g. Marketing Director"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`phone-${userId}`}>Phone</label>
              <input className={styles.input} id={`phone-${userId}`} name="phone" defaultValue={phone ?? ''} />
            </div>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
