'use client';

import type { Office } from '@prisma/client';
import { createClient } from '../../../lib/portal/actions/clients';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

export function CreateClientForm({ offices }: { offices: readonly Office[] }) {
  return (
    <ActionForm action={createClient} submitLabel="Create client">
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="companyName">Company name</label>
          <input className={styles.input} id="companyName" name="companyName" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="officeId">Office</label>
          <select className={styles.select} id="officeId" name="officeId" required defaultValue="">
            <option value="" disabled>Select an office…</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>{office.displayName}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contactName">Contact name</label>
          <input className={styles.input} id="contactName" name="contactName" required />
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contactEmail">Contact email</label>
          <input className={styles.input} id="contactEmail" name="contactEmail" type="email" required />
        </div>
      </div>
      <p className={styles.cardMeta}>
        No password to set here — a welcome email with a &quot;set your password&quot; link is sent to this address automatically.
      </p>
    </ActionForm>
  );
}
