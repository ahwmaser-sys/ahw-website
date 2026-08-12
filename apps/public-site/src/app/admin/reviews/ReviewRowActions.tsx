'use client';

import { useState } from 'react';
import { setReviewFeatured, setReviewPublished, updateReviewDisplayOrder, deleteReviewRecord } from '../../../lib/portal/actions/reviews';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

interface ReviewRowActionsProps {
  reviewId: string;
  featured: boolean;
  published: boolean;
  displayOrder: number;
}

export function ReviewRowActions({ reviewId, featured, published, displayOrder }: ReviewRowActionsProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className={styles.buttonRow}>
      <ActionForm
        action={setReviewFeatured}
        submitLabel={featured ? 'Unfeature' : 'Feature'}
        buttonClassName={featured ? styles.buttonSecondary : styles.button}
      >
        <input type="hidden" name="reviewId" value={reviewId} />
        <input type="hidden" name="value" value={(!featured).toString()} />
      </ActionForm>

      <ActionForm
        action={setReviewPublished}
        submitLabel={published ? 'Hide' : 'Publish'}
        buttonClassName={published ? styles.buttonSecondary : styles.button}
      >
        <input type="hidden" name="reviewId" value={reviewId} />
        <input type="hidden" name="value" value={(!published).toString()} />
      </ActionForm>

      <ActionForm action={updateReviewDisplayOrder} submitLabel="Save order" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
        <input type="hidden" name="reviewId" value={reviewId} />
        <input
          type="number"
          name="displayOrder"
          defaultValue={displayOrder}
          className={styles.input}
          style={{ width: '4.5rem' }}
          aria-label="Display order"
        />
      </ActionForm>

      {/* Deleting removes only this local record — it never calls Google
          and never affects the review on the customer's actual Google
          Business Profile. Confirmed inline (not a browser confirm())
          because a real button + real label is what a screen reader
          user actually gets to review before committing. */}
      {confirmingDelete ? (
        <span className={styles.buttonRow}>
          <span className={styles.captionText}>Delete local record only? Google is unaffected.</span>
          <ActionForm action={deleteReviewRecord} submitLabel="Confirm delete" buttonClassName={styles.buttonDanger}>
            <input type="hidden" name="reviewId" value={reviewId} />
          </ActionForm>
          <button type="button" className={styles.buttonSecondary} onClick={() => setConfirmingDelete(false)}>
            Cancel
          </button>
        </span>
      ) : (
        <button type="button" className={styles.buttonSecondary} onClick={() => setConfirmingDelete(true)}>
          Delete local record
        </button>
      )}
    </div>
  );
}
