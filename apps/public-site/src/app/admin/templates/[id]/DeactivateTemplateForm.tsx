'use client';

import { deactivateTemplate, reactivateTemplate, deleteTemplate } from '../../../../lib/portal/actions/templates';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export function DeactivateTemplateForm({ templateId }: { templateId: string }) {
  return (
    <ActionForm action={deactivateTemplate} submitLabel="Deactivate template" buttonClassName={styles.buttonDanger}>
      <input type="hidden" name="templateId" value={templateId} />
    </ActionForm>
  );
}

export function ReactivateTemplateForm({ templateId }: { templateId: string }) {
  return (
    <ActionForm action={reactivateTemplate} submitLabel="Reactivate template" buttonClassName={styles.buttonSecondary}>
      <input type="hidden" name="templateId" value={templateId} />
    </ActionForm>
  );
}

export function DeleteTemplateForm({ templateId }: { templateId: string }) {
  return (
    <ActionForm action={deleteTemplate} submitLabel="Delete template permanently" buttonClassName={styles.buttonDanger}>
      <input type="hidden" name="templateId" value={templateId} />
    </ActionForm>
  );
}
