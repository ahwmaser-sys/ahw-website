'use client';

import { connectGoogleAnalytics, connectSearchConsole, connectGoogleMaps, connectEmail, completeLinkedInConnection, completeGoogleBusinessConnection } from '../../../../lib/portal/actions/integrations';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export function OAuthConnectLink({ type, officeId }: { type: string; officeId: string }) {
  return (
    <a href={`/api/portal/integrations/oauth/${type}/start?officeId=${officeId}`} className={styles.button}>
      Connect via OAuth
    </a>
  );
}

export function LinkedInFollowUpForm({ officeId }: { officeId: string }) {
  return (
    <ActionForm action={completeLinkedInConnection} submitLabel="Finish setup">
      <input type="hidden" name="officeId" value={officeId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="organizationId">LinkedIn Organization ID</label>
        <input className={styles.input} id="organizationId" name="organizationId" placeholder="e.g. 12345678" required />
      </div>
    </ActionForm>
  );
}

export function GoogleBusinessFollowUpForm({ officeId }: { officeId: string }) {
  return (
    <ActionForm action={completeGoogleBusinessConnection} submitLabel="Finish setup">
      <input type="hidden" name="officeId" value={officeId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="locationId">Location ID</label>
        <input className={styles.input} id="locationId" name="locationId" placeholder="accounts/123/locations/456" required />
      </div>
    </ActionForm>
  );
}

export function GoogleAnalyticsConnectForm() {
  return (
    <ActionForm action={connectGoogleAnalytics} submitLabel="Connect">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="ga-propertyId">GA4 Property ID</label>
        <input className={styles.input} id="ga-propertyId" name="propertyId" placeholder="e.g. 123456789" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="ga-key">Service account JSON key</label>
        <textarea className={styles.monospaceTextarea} id="ga-key" name="serviceAccountJson" rows={6} placeholder="Paste the full downloaded key file" required />
      </div>
    </ActionForm>
  );
}

export function SearchConsoleConnectForm({ siteUrl }: { siteUrl: string }) {
  return (
    <ActionForm action={connectSearchConsole} submitLabel="Connect">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="gsc-siteUrl">Site URL (as verified in Search Console)</label>
        <input className={styles.input} id="gsc-siteUrl" name="siteUrl" placeholder={`${siteUrl}/`} defaultValue={`${siteUrl}/`} required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="gsc-key">Service account JSON key</label>
        <textarea className={styles.monospaceTextarea} id="gsc-key" name="serviceAccountJson" rows={6} placeholder="Paste the full downloaded key file" required />
      </div>
    </ActionForm>
  );
}

export function GoogleMapsConnectForm() {
  return (
    <ActionForm action={connectGoogleMaps} submitLabel="Connect">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="maps-key">API key</label>
        <input className={styles.input} id="maps-key" name="apiKey" required />
      </div>
    </ActionForm>
  );
}

export function EmailConnectForm() {
  return (
    <ActionForm action={connectEmail} submitLabel="Connect">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email-key">Resend API key</label>
        <input className={styles.input} id="email-key" name="apiKey" required />
      </div>
    </ActionForm>
  );
}
