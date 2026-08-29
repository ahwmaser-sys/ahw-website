'use client';

import { createNewsPost } from '../../../lib/portal/actions/news';
import { ActionForm } from '../../../components/portal/ActionForm';
import { ArticleBodyEditor } from './[id]/ArticleBodyEditor';
import styles from '../../../components/portal/portal-ui.module.css';

export function CreateNewsForm() {
  return (
    <ActionForm action={createNewsPost} submitLabel="Create draft">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">Title</label>
        <input className={styles.input} id="title" name="title" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="excerpt">Excerpt</label>
        <input className={styles.input} id="excerpt" name="excerpt" required />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Body</span>
        {/* No gallery yet — the post doesn't exist until this form is
            submitted. Add photos to the Gallery after creating the
            draft, then use the body editor on its own page to place them. */}
        <ArticleBodyEditor initialBody="" galleryOptions={[]} />
      </div>
    </ActionForm>
  );
}
