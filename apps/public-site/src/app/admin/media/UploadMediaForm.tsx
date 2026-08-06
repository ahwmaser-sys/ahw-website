'use client';

import { useState } from 'react';
import { uploadMediaAsset } from '../../../lib/portal/actions/media';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

interface Props {
  projects: { id: string; name: string }[];
}

export function UploadMediaForm({ projects }: Props) {
  const [kind, setKind] = useState('IMAGE');

  return (
    <ActionForm action={uploadMediaAsset} submitLabel="Upload" pendingLabel="Processing…">
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="kind">Type</label>
          <select className={styles.select} id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="DOCUMENT">Document</option>
            <option value="ICON">Icon</option>
            <option value="LOGO">Logo</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="mediaFile">File</label>
          <input className={styles.input} id="mediaFile" name="file" type="file" required />
        </div>
      </div>

      {kind === 'IMAGE' && (
        <p className={styles.cardMeta}>
          Images automatically pass through validation, optimization, smart cropping, and compression — all 8
          platform-ready output sizes are generated on upload.
        </p>
      )}

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="photographer">Photographer</label>
          <input className={styles.input} id="photographer" name="photographer" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="copyright">Copyright</label>
          <input className={styles.input} id="copyright" name="copyright" placeholder="© AHW Architects 2026" />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="altText">Alt text</label>
        <input className={styles.input} id="altText" name="altText" />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="project">Project (optional)</label>
          <select className={styles.select} id="project" name="projectId" defaultValue="">
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="service">Service (optional)</label>
          <select className={styles.select} id="service" name="service" defaultValue="">
            <option value="">None</option>
            <option value="ARCHITECTURE">Architecture</option>
            <option value="INTERIOR_DESIGN">Interior Design</option>
            <option value="DESIGN_BUILD">Design-Build</option>
            <option value="FIT_OUT">Fit-Out</option>
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="keywords">Keywords (comma separated)</label>
          <input className={styles.input} id="keywords" name="keywords" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="tags">Tags (comma separated)</label>
          <input className={styles.input} id="tags" name="tags" />
        </div>
      </div>
    </ActionForm>
  );
}
