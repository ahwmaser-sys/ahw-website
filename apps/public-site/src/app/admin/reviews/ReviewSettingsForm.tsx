'use client';

import { updateReviewSettings } from '../../../lib/portal/actions/brand-kit';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';
import type { BrandReviewSettings } from '../../../lib/portal/brand-kit';

export function ReviewSettingsForm({ settings }: { settings: BrandReviewSettings }) {
  return (
    <ActionForm action={updateReviewSettings} submitLabel="Save display settings">
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="countDisplayMode">Review count display</label>
          <select className={styles.select} id="countDisplayMode" name="countDisplayMode" defaultValue={settings.countDisplayMode}>
            <option value="ALWAYS_HIDE">Always hide</option>
            <option value="ALWAYS_SHOW">Always show</option>
            <option value="THRESHOLD">Show once the verified Google total reaches a threshold (recommended)</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="countThreshold">Threshold (verified Google review total)</label>
          <input className={styles.input} id="countThreshold" name="countThreshold" type="number" min={1} step={1} defaultValue={settings.countThreshold} />
        </div>
      </div>
    </ActionForm>
  );
}
