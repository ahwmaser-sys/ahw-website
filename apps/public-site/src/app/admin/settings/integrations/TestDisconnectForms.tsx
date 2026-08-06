'use client';

import { testIntegrationAction, disconnectIntegrationAction } from '../../../../lib/portal/actions/integrations';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export function TestConnectionForm({ type, officeId }: { type: string; officeId?: string }) {
  return (
    <ActionForm action={testIntegrationAction} submitLabel="Test Connection" pendingLabel="Testing…" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="type" value={type} />
      {officeId && <input type="hidden" name="officeId" value={officeId} />}
    </ActionForm>
  );
}

export function DisconnectForm({ type, officeId }: { type: string; officeId?: string }) {
  return (
    <ActionForm action={disconnectIntegrationAction} submitLabel="Disconnect" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="type" value={type} />
      {officeId && <input type="hidden" name="officeId" value={officeId} />}
    </ActionForm>
  );
}
