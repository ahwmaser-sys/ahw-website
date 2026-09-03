'use client';

import { createInvoice, recordInvoicePayment, deleteInvoice } from '../../../../lib/portal/actions/invoices';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export function CreateInvoiceForm({ projectId }: { projectId: string }) {
  return (
    <ActionForm action={createInvoice} submitLabel="Create invoice">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="amount">Amount</label>
          <input className={styles.input} id="amount" name="amount" type="number" step="0.01" min="0.01" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="currency">Currency</label>
          <input className={styles.input} id="currency" name="currency" defaultValue="USD" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="dueDate">Due date</label>
          <input className={styles.input} id="dueDate" name="dueDate" type="date" />
        </div>
      </div>
    </ActionForm>
  );
}

export function RecordPaymentForm({ invoiceId, projectId }: { invoiceId: string; projectId: string }) {
  return (
    <ActionForm action={recordInvoicePayment} submitLabel="Record payment" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`payment-${invoiceId}`}>Payment amount</label>
        <input className={styles.input} id={`payment-${invoiceId}`} name="amount" type="number" step="0.01" min="0.01" required />
      </div>
    </ActionForm>
  );
}

export function DeleteInvoiceButton({ invoiceId, projectId }: { invoiceId: string; projectId: string }) {
  return (
    <ActionForm action={deleteInvoice} submitLabel="Delete invoice" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <input type="hidden" name="projectId" value={projectId} />
    </ActionForm>
  );
}
