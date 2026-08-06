'use client';

import { updateMediaAssetMetadata, deleteMediaAsset, archiveMediaAsset, restoreMediaAsset } from '../../../../lib/portal/actions/media';
import { generateAssetAITags } from '../../../../lib/portal/actions/ai-content';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

interface Props {
  assetId: string;
  photographer: string | null;
  copyright: string | null;
  altText: string | null;
  keywords: string[];
  tags: string[];
}

export function EditMetadataForm({ assetId, photographer, copyright, altText, keywords, tags }: Props) {
  return (
    <ActionForm action={updateMediaAssetMetadata} submitLabel="Save metadata">
      <input type="hidden" name="assetId" value={assetId} />
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="photographer">Photographer</label>
          <input className={styles.input} id="photographer" name="photographer" defaultValue={photographer ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="copyright">Copyright</label>
          <input className={styles.input} id="copyright" name="copyright" defaultValue={copyright ?? ''} />
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="altText">Alt text</label>
        <input className={styles.input} id="altText" name="altText" defaultValue={altText ?? ''} />
      </div>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="keywords">Keywords (comma separated)</label>
          <input className={styles.input} id="keywords" name="keywords" defaultValue={keywords.join(', ')} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="tags">Tags (comma separated)</label>
          <input className={styles.input} id="tags" name="tags" defaultValue={tags.join(', ')} />
        </div>
      </div>
    </ActionForm>
  );
}

export function GenerateAITagsForm({ assetId }: { assetId: string }) {
  return (
    <ActionForm action={generateAssetAITags} submitLabel="Generate AI tags" buttonClassName={styles.buttonSecondary} pendingLabel="Analyzing…">
      <input type="hidden" name="assetId" value={assetId} />
    </ActionForm>
  );
}

export function DeleteAssetForm({ assetId }: { assetId: string }) {
  return (
    <ActionForm action={deleteMediaAsset} submitLabel="Delete permanently" buttonClassName={styles.buttonDanger}>
      <input type="hidden" name="assetId" value={assetId} />
    </ActionForm>
  );
}

export function ArchiveAssetForm({ assetId }: { assetId: string }) {
  return (
    <ActionForm action={archiveMediaAsset} submitLabel="Archive" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="assetId" value={assetId} />
    </ActionForm>
  );
}

export function RestoreAssetForm({ assetId }: { assetId: string }) {
  return (
    <ActionForm action={restoreMediaAsset} submitLabel="Restore" className={styles.buttonRow}>
      <input type="hidden" name="assetId" value={assetId} />
    </ActionForm>
  );
}
