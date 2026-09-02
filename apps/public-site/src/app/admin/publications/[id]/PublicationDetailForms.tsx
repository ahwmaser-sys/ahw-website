'use client';

import {
  updatePublicationMetadata,
  updatePublicationContent,
  setPublicationCoverImage,
  clearPublicationCoverImage,
  updatePublicationRelated,
  publishPublication,
  unpublishPublication,
  deletePublication,
} from '../../../../lib/portal/actions/publications';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function EditMetadataForm({
  publicationId,
  title,
  slug,
  outlet,
  url,
  date,
  readingTime,
  tags,
  isFeatured,
}: {
  publicationId: string;
  title: string;
  slug: string;
  outlet: string;
  url: string;
  date: Date;
  readingTime: string | null;
  tags: string[];
  isFeatured: boolean;
}) {
  return (
    <ActionForm action={updatePublicationMetadata} submitLabel="Save changes">
      <input type="hidden" name="publicationId" value={publicationId} />
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="title">Title</label>
          <input className={styles.input} id="title" name="title" defaultValue={title} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="slug">Slug</label>
          <input className={styles.input} id="slug" name="slug" defaultValue={slug} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="outlet">Outlet</label>
          <input className={styles.input} id="outlet" name="outlet" defaultValue={outlet} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="url">Original feature URL</label>
          <input className={styles.input} id="url" name="url" type="url" defaultValue={url} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="date">Date</label>
          <input className={styles.input} id="date" name="date" type="date" defaultValue={toDateInputValue(date)} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="readingTime">Reading time</label>
          <input className={styles.input} id="readingTime" name="readingTime" defaultValue={readingTime ?? ''} placeholder="3 min read" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="tags">Tags</label>
          <input className={styles.input} id="tags" name="tags" defaultValue={tags.join(', ')} placeholder="Awards, KSA, Design & Build" />
          <p className={styles.hint}>Comma-separated. Powers the pill badges and the listing filter.</p>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>
            <input type="checkbox" name="isFeatured" defaultChecked={isFeatured} /> Featured
          </label>
        </div>
      </div>
    </ActionForm>
  );
}

export function EditContentForm({ publicationId, excerpt, content }: { publicationId: string; excerpt: string; content: string | null }) {
  return (
    <ActionForm action={updatePublicationContent} submitLabel="Save changes">
      <input type="hidden" name="publicationId" value={publicationId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="excerpt">Excerpt</label>
        <textarea className={styles.textarea} id="excerpt" name="excerpt" defaultValue={excerpt} rows={3} required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="content">Full text (optional)</label>
        <textarea className={styles.textarea} id="content" name="content" defaultValue={content ?? ''} rows={8} />
        <p className={styles.hint}>Falls back to the excerpt on the public page when left empty.</p>
      </div>
    </ActionForm>
  );
}

export function CoverImageForm({ publicationId, coverImageCaption }: { publicationId: string; coverImageCaption: string | null }) {
  return (
    <ActionForm action={setPublicationCoverImage} submitLabel="Upload cover image" pendingLabel="Uploading…" className={styles.formSpacer}>
      <input type="hidden" name="publicationId" value={publicationId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="file">Image file</label>
        <input type="file" id="file" name="file" accept="image/*" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="coverImageCaption">Caption (optional)</label>
        <input className={styles.input} id="coverImageCaption" name="coverImageCaption" defaultValue={coverImageCaption ?? ''} />
      </div>
    </ActionForm>
  );
}

export function ClearCoverImageForm({ publicationId }: { publicationId: string }) {
  return (
    <ActionForm action={clearPublicationCoverImage} submitLabel="Clear" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="publicationId" value={publicationId} />
    </ActionForm>
  );
}

export function EditRelatedForm({
  publicationId,
  relatedProjectSlugs,
  projectOptions,
}: {
  publicationId: string;
  relatedProjectSlugs: string[];
  projectOptions: { slug: string; title: string }[];
}) {
  return (
    <ActionForm action={updatePublicationRelated} submitLabel="Save changes">
      <input type="hidden" name="publicationId" value={publicationId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="relatedProjectSlugs">Related projects</label>
        <select className={styles.select} id="relatedProjectSlugs" name="relatedProjectSlugs" multiple size={6} defaultValue={relatedProjectSlugs}>
          {projectOptions.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
        </select>
        <p className={styles.hint}>Cmd/Ctrl-click to select more than one.</p>
      </div>
    </ActionForm>
  );
}

export function PublishForm({ publicationId }: { publicationId: string }) {
  return (
    <ActionForm action={publishPublication} submitLabel="Publish" className={styles.buttonRow}>
      <input type="hidden" name="publicationId" value={publicationId} />
    </ActionForm>
  );
}

export function UnpublishForm({ publicationId }: { publicationId: string }) {
  return (
    <ActionForm action={unpublishPublication} submitLabel="Unpublish" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="publicationId" value={publicationId} />
    </ActionForm>
  );
}

export function DeleteForm({ publicationId }: { publicationId: string }) {
  return (
    <ActionForm action={deletePublication} submitLabel="Delete" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="publicationId" value={publicationId} />
    </ActionForm>
  );
}
