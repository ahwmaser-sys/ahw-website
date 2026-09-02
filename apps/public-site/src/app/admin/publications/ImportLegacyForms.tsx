'use client';

import { previewLegacyPublicationsImport, runLegacyPublicationsImport } from '../../../lib/portal/actions/publications';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function ImportLegacyForms() {
  return (
    <div className={styles.buttonRow}>
      <ActionForm action={previewLegacyPublicationsImport} submitLabel="Preview (no changes)" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
        {null}
      </ActionForm>
      <ActionForm action={runLegacyPublicationsImport} submitLabel="Run import" pendingLabel="Importing…" className={styles.buttonRow}>
        {null}
      </ActionForm>
    </div>
  );
}
