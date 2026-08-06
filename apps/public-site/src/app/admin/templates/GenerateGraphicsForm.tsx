'use client';

import { useState } from 'react';
import { generateGraphics } from '../../../lib/portal/actions/templates';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

interface TemplateOption {
  id: string;
  key: string;
  name: string;
  variables: string[];
}

interface AssetOption {
  id: string;
  fileName: string;
}

interface OutputTargetOption {
  key: string;
  label: string;
  width: number;
  height: number;
}

interface Props {
  templates: TemplateOption[];
  assets: AssetOption[];
  outputTargets: OutputTargetOption[];
  newsPosts: { id: string; title: string }[];
  campaigns: { id: string; name: string }[];
}

export function GenerateGraphicsForm({ templates, assets, outputTargets, newsPosts, campaigns }: Props) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? '');
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  if (templates.length === 0) {
    return <p className={styles.cardMeta}>No templates yet.</p>;
  }
  if (assets.length === 0) {
    return <p className={styles.cardMeta}>Upload an IMAGE asset in the Media Library first.</p>;
  }

  return (
    <ActionForm action={generateGraphics} submitLabel="Generate" pendingLabel="Rendering…">
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="templateId">Template</label>
          <select
            className={styles.select}
            id="templateId"
            name="templateId"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="sourceAssetId">Image</label>
          <select className={styles.select} id="sourceAssetId" name="sourceAssetId" required>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>{a.fileName}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedTemplate && selectedTemplate.variables.length > 0 && (
        <div className={styles.formRow}>
          {selectedTemplate.variables.map((variable) => (
            <div className={styles.field} key={variable}>
              <label className={styles.label} htmlFor={`var_${variable}`}>{variable}</label>
              <input className={styles.input} id={`var_${variable}`} name={`var_${variable}`} />
            </div>
          ))}
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label}>Outputs</label>
        <div className={styles.formRow}>
          {outputTargets.map((target) => (
            <label key={target.key} className={styles.checkboxRow}>
              <input type="checkbox" name="targets" value={target.key} defaultChecked />
              {target.label} ({target.width}×{target.height})
            </label>
          ))}
        </div>
      </div>

      <div className={styles.formRow}>
        {newsPosts.length > 0 && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="newsPostId">Attach to article (optional)</label>
            <select className={styles.select} id="newsPostId" name="newsPostId" defaultValue="">
              <option value="">None</option>
              {newsPosts.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        )}
        {campaigns.length > 0 && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="campaignId">Attach to campaign (optional)</label>
            <select className={styles.select} id="campaignId" name="campaignId" defaultValue="">
              <option value="">None</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </ActionForm>
  );
}
