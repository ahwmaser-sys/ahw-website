'use client';

import { createTemplate } from '../../../lib/portal/actions/templates';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

const EXAMPLE_DEFINITION = JSON.stringify(
  {
    variables: ['headline', 'websiteUrl'],
    layers: [
      { type: 'image', source: 'sourceAsset', fit: 'cover' },
      { type: 'gradient-overlay', direction: 'to-top', colorToken: 'ink', maxOpacity: 0.85 },
      {
        type: 'text',
        variable: 'headline',
        fallback: 'Headline',
        position: { xPct: 0.06, yPct: 0.85 },
        anchorX: 'left',
        anchorY: 'bottom',
        fontToken: 'secondary',
        weightToken: 'light',
        sizeToken: 'display',
        colorToken: 'paper',
        maxWidthPct: 0.85,
      },
    ],
  },
  null,
  2
);

// The plugin-friendly path: a new template is JSON submitted here, never
// a code change or a deploy — the renderer (lib/content-studio/
// template-engine/render.tsx) interprets whatever layer types this JSON
// declares. No visual editor in this pass (a real design tool is a
// separate project); this is the mechanism, not the final authoring UX.
export function CreateTemplateForm() {
  return (
    <ActionForm action={createTemplate} submitLabel="Create template">
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="key">Key (unique, no spaces)</label>
          <input className={styles.input} id="key" name="key" placeholder="my-custom-template" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Name</label>
          <input className={styles.input} id="name" name="name" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="category">Category</label>
          <input className={styles.input} id="category" name="category" required />
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">Description</label>
        <input className={styles.input} id="description" name="description" />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="definitionJson">Definition (JSON)</label>
        <textarea
          className={`${styles.textarea} ${styles.monospaceTextarea}`}
          id="definitionJson"
          name="definitionJson"
          defaultValue={EXAMPLE_DEFINITION}
          rows={16}
        />
      </div>
    </ActionForm>
  );
}
