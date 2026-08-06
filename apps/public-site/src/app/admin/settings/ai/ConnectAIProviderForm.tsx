'use client';

import { connectAIProvider } from '../../../../lib/portal/actions/integrations';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export function ConnectAIProviderForm({ type, modelRequired, modelPlaceholder }: { type: string; modelRequired?: boolean; modelPlaceholder: string }) {
  return (
    <ActionForm action={connectAIProvider} submitLabel="Connect">
      <input type="hidden" name="type" value={type} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${type}-apiKey`}>API key</label>
        <input className={styles.input} id={`${type}-apiKey`} name="apiKey" type="password" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${type}-model`}>Model{modelRequired ? '' : ' (optional override)'}</label>
        <input className={styles.input} id={`${type}-model`} name="model" placeholder={modelPlaceholder} required={modelRequired} />
      </div>
    </ActionForm>
  );
}
