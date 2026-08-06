'use client';

import { createMediaCollection, createCategory, addAssetToCollection, deleteCategory, deleteTag } from '../../../lib/portal/actions/media';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function CreateCollectionForm() {
  return (
    <ActionForm action={createMediaCollection} submitLabel="Create collection">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="collectionName">Name</label>
        <input className={styles.input} id="collectionName" name="name" required />
      </div>
    </ActionForm>
  );
}

// Categories are the curated taxonomy shared by the Media Library and
// Articles (see NewsPost/MediaAsset's shared Category model) — created
// here, then picked from a checkbox list on the Article editor and the
// asset metadata form, rather than free-typed per item like tags are.
export function CreateCategoryForm() {
  return (
    <ActionForm action={createCategory} submitLabel="Create category">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="categoryName">Name</label>
        <input className={styles.input} id="categoryName" name="name" required />
      </div>
    </ActionForm>
  );
}

export function DeleteCategoryForm({ id }: { id: string }) {
  return (
    <ActionForm action={deleteCategory} submitLabel="Delete" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="id" value={id} />
    </ActionForm>
  );
}

export function DeleteTagForm({ id }: { id: string }) {
  return (
    <ActionForm action={deleteTag} submitLabel="Delete" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="id" value={id} />
    </ActionForm>
  );
}

export function AddToCollectionForm({ assetId, collections }: { assetId: string; collections: { id: string; name: string }[] }) {
  if (collections.length === 0) {
    return <p className={styles.cardMeta}>No collections yet — create one from the Media Library page.</p>;
  }
  return (
    <ActionForm action={addAssetToCollection} submitLabel="Add" className={styles.buttonRow}>
      <input type="hidden" name="assetId" value={assetId} />
      <select className={styles.select} name="collectionId" required>
        {collections.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </ActionForm>
  );
}
