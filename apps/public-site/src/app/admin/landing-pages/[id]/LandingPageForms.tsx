'use client';

import { updateLandingPage, publishLandingPage, unpublishLandingPage, archiveLandingPage, restoreLandingPage, deleteLandingPage } from '../../../../lib/portal/actions/landing-pages';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

interface Props {
  pageId: string;
  title: string;
  blocksJson: string;
  campaignId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageId: string | null;
  campaigns: { id: string; name: string }[];
  imageAssets: { id: string; fileName: string }[];
}

// The blocks editor is raw JSON in this pass, same precedent as the
// custom Social Template definition editor — a real visual block editor
// is a separate, substantial UI project (see the final report's scope
// notes), not something to fake with a half-built drag-and-drop that
// doesn't actually work.
export function EditLandingPageForm({ pageId, title, blocksJson, campaignId, metaTitle, metaDescription, ogImageId, campaigns, imageAssets }: Props) {
  return (
    <ActionForm action={updateLandingPage} submitLabel="Save landing page">
      <input type="hidden" name="pageId" value={pageId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">Title</label>
        <input className={styles.input} id="title" name="title" defaultValue={title} required />
      </div>

      {campaigns.length > 0 && (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="campaignId">Campaign (optional)</label>
          <select className={styles.select} id="campaignId" name="campaignId" defaultValue={campaignId ?? ''}>
            <option value="">None</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="blocksJson">Blocks (JSON)</label>
        <textarea className={`${styles.textarea} ${styles.monospaceTextarea}`} id="blocksJson" name="blocksJson" defaultValue={blocksJson} rows={18} required />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="metaTitle">Meta title</label>
          <input className={styles.input} id="metaTitle" name="metaTitle" defaultValue={metaTitle ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ogImageId">Open Graph image</label>
          <select className={styles.select} id="ogImageId" name="ogImageId" defaultValue={ogImageId ?? ''}>
            <option value="">None</option>
            {imageAssets.map((a) => (
              <option key={a.id} value={a.id}>{a.fileName}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="metaDescription">Meta description</label>
        <textarea className={styles.textarea} id="metaDescription" name="metaDescription" defaultValue={metaDescription ?? ''} />
      </div>
    </ActionForm>
  );
}

export function PublishLandingPageForm({ pageId }: { pageId: string }) {
  return (
    <ActionForm action={publishLandingPage} submitLabel="Publish">
      <input type="hidden" name="pageId" value={pageId} />
    </ActionForm>
  );
}

export function UnpublishLandingPageForm({ pageId }: { pageId: string }) {
  return (
    <ActionForm action={unpublishLandingPage} submitLabel="Unpublish" buttonClassName={styles.buttonDanger}>
      <input type="hidden" name="pageId" value={pageId} />
    </ActionForm>
  );
}

export function ArchiveLandingPageForm({ pageId }: { pageId: string }) {
  return (
    <ActionForm action={archiveLandingPage} submitLabel="Archive" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="pageId" value={pageId} />
    </ActionForm>
  );
}

export function RestoreLandingPageForm({ pageId }: { pageId: string }) {
  return (
    <ActionForm action={restoreLandingPage} submitLabel="Restore to Draft" className={styles.buttonRow}>
      <input type="hidden" name="pageId" value={pageId} />
    </ActionForm>
  );
}

export function DeleteLandingPageForm({ pageId }: { pageId: string }) {
  return (
    <ActionForm action={deleteLandingPage} submitLabel="Delete draft permanently" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="pageId" value={pageId} />
    </ActionForm>
  );
}
