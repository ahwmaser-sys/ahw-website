'use client';

import type { EmailSettings } from '@prisma/client';
import { updateEmailSettings } from '../../../../lib/portal/actions/email-settings';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

const SENDER_TYPES = [
  { type: 'contact', label: 'Contact', hint: 'Contact form notifications and confirmations.' },
  { type: 'careers', label: 'Careers', hint: 'Careers application notifications and confirmations.' },
  { type: 'support', label: 'Support', hint: 'Reserved for a future support-email flow.' },
  { type: 'sales', label: 'Sales', hint: 'Reserved for a future sales-email flow.' },
  { type: 'marketing', label: 'Marketing', hint: 'Reserved for a future marketing-email flow.' },
] as const;

export function EmailSettingsForm({ settings }: { settings: EmailSettings }) {
  return (
    <ActionForm action={updateEmailSettings} submitLabel="Save email settings">
      <h3 className={styles.sectionTitle}>Recipients</h3>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="primaryContactEmail">Primary contact email</label>
          <input className={styles.input} id="primaryContactEmail" name="primaryContactEmail" type="email" defaultValue={settings.primaryContactEmail} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="secondaryContactEmail">Secondary contact email</label>
          <input className={styles.input} id="secondaryContactEmail" name="secondaryContactEmail" type="email" defaultValue={settings.secondaryContactEmail ?? ''} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="careersEmail">Careers email</label>
          <input className={styles.input} id="careersEmail" name="careersEmail" type="email" defaultValue={settings.careersEmail ?? ''} placeholder={`Falls back to HR, then ${settings.primaryContactEmail}`} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="hrEmail">HR email</label>
          <input className={styles.input} id="hrEmail" name="hrEmail" type="email" defaultValue={settings.hrEmail ?? ''} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="supportEmail">Support email</label>
          <input className={styles.input} id="supportEmail" name="supportEmail" type="email" defaultValue={settings.supportEmail ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="salesEmail">Sales email</label>
          <input className={styles.input} id="salesEmail" name="salesEmail" type="email" defaultValue={settings.salesEmail ?? ''} />
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Sender identity</h3>
      <p className={styles.subtitle}>
        The From name/address and Reply-To each email type sends with — separate from the recipients above. Leave a
        type blank to keep the default sender (AHW Architects &lt;noreply@contact.ahwspaces.com&gt;, no reply-to).
      </p>

      {SENDER_TYPES.map(({ type, label, hint }) => {
        const nameKey = `${type}FromName` as const;
        const emailKey = `${type}FromEmail` as const;
        const replyKey = `${type}ReplyTo` as const;
        return (
          <div key={type} className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={nameKey}>{label} — From name</label>
              <input className={styles.input} id={nameKey} name={nameKey} type="text" defaultValue={settings[nameKey] ?? ''} placeholder="AHW Architects" />
              <span className={styles.hint}>{hint}</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={emailKey}>{label} — From email</label>
              <input className={styles.input} id={emailKey} name={emailKey} type="email" defaultValue={settings[emailKey] ?? ''} placeholder="noreply@contact.ahwspaces.com" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={replyKey}>{label} — Reply-To</label>
              <input className={styles.input} id={replyKey} name={replyKey} type="email" defaultValue={settings[replyKey] ?? ''} />
            </div>
          </div>
        );
      })}
    </ActionForm>
  );
}
