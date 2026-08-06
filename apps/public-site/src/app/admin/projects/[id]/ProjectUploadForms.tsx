'use client';

import { uploadDocument, uploadPhoto } from '../../../../lib/portal/actions/uploads';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export function UploadDocumentForm({ projectId }: { projectId: string }) {
  return (
    <ActionForm action={uploadDocument} submitLabel="Upload document" pendingLabel="Uploading…">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="docCategory">Category</label>
          <select className={styles.select} id="docCategory" name="category" defaultValue="OTHER">
            <option value="DRAWING">Drawing</option>
            <option value="CONTRACT">Contract</option>
            <option value="BOQ">BOQ</option>
            <option value="REPORT">Report</option>
            <option value="WARRANTY">Warranty</option>
            <option value="INVOICE">Invoice</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="docFile">File</label>
          <input className={styles.input} id="docFile" name="file" type="file" required />
        </div>
      </div>
    </ActionForm>
  );
}

export function UploadPhotoForm({ projectId }: { projectId: string }) {
  return (
    <ActionForm action={uploadPhoto} submitLabel="Upload photo" pendingLabel="Uploading…">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="photoPhase">Phase</label>
          <select className={styles.select} id="photoPhase" name="phase" defaultValue="DURING">
            <option value="BEFORE">Before</option>
            <option value="DURING">During</option>
            <option value="AFTER">After</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="photoFile">Image</label>
          <input className={styles.input} id="photoFile" name="file" type="file" accept="image/*" required />
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="photoCaption">Caption (optional)</label>
        <input className={styles.input} id="photoCaption" name="caption" />
      </div>
    </ActionForm>
  );
}
