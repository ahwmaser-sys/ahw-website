'use client';

import { previewLegacyPortfolioImport, runLegacyPortfolioImport } from '../../../lib/portal/actions/portfolio';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function ImportLegacyForms() {
  return (
    <div className={styles.buttonRow}>
      <ActionForm action={previewLegacyPortfolioImport} submitLabel="Preview (no changes)" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
        {null}
      </ActionForm>
      <ActionForm action={runLegacyPortfolioImport} submitLabel="Run import" pendingLabel="Importing…" className={styles.buttonRow}>
        {null}
      </ActionForm>
    </div>
  );
}
