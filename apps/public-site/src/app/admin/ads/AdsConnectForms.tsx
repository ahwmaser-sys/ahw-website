'use client';

import { completeGoogleAdsConnection, completeMetaAdsConnection, completeLinkedInAdsConnection, completeTikTokAdsConnection, syncAdPlatformAction } from '../../../lib/portal/actions/ads';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

// Company-wide variant of settings/integrations/ConnectForms.tsx's
// OAuthConnectLink — no officeId query param, since every type here
// (GOOGLE_ADS/META_ADS/LINKEDIN_ADS/TIKTOK_ADS) is company-wide. Reuses
// the exact same generic `/api/portal/integrations/oauth/[type]/start`
// route (extended in this pass to also accept these four types).
export function AdOAuthConnectLink({ type }: { type: string }) {
  return (
    <a href={`/api/portal/integrations/oauth/${type}/start`} className={styles.button}>
      Connect via OAuth
    </a>
  );
}

export function GoogleAdsFollowUpForm() {
  return (
    <ActionForm action={completeGoogleAdsConnection} submitLabel="Finish setup">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="ga-customerId">Google Ads Customer ID</label>
        <input className={styles.input} id="ga-customerId" name="customerId" placeholder="e.g. 123-456-7890" required />
        <p className={styles.hint}>Found top-right in the Google Ads UI. The AW- conversion ID (AW-18370654415) is usually the same account, but confirm here rather than assuming.</p>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="ga-loginCustomerId">Manager (MCC) account ID — optional</label>
        <input className={styles.input} id="ga-loginCustomerId" name="loginCustomerId" placeholder="Only if this account is managed under an MCC" />
      </div>
    </ActionForm>
  );
}

export function MetaAdsFollowUpForm() {
  return (
    <ActionForm action={completeMetaAdsConnection} submitLabel="Finish setup">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="meta-adAccountId">Meta Ad Account ID</label>
        <input className={styles.input} id="meta-adAccountId" name="adAccountId" placeholder="e.g. act_123456789 or 123456789" required />
      </div>
    </ActionForm>
  );
}

export function LinkedInAdsFollowUpForm() {
  return (
    <ActionForm action={completeLinkedInAdsConnection} submitLabel="Finish setup">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="li-adAccountId">LinkedIn Ad Account ID</label>
        <input className={styles.input} id="li-adAccountId" name="adAccountId" placeholder="e.g. 123456789" required />
      </div>
    </ActionForm>
  );
}

export function TikTokAdsFollowUpForm() {
  return (
    <ActionForm action={completeTikTokAdsConnection} submitLabel="Finish setup">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="tt-advertiserId">TikTok Advertiser ID</label>
        <input className={styles.input} id="tt-advertiserId" name="advertiserId" placeholder="e.g. 1234567890123456789" required />
      </div>
    </ActionForm>
  );
}

export function SyncNowForm({ platform }: { platform: string }) {
  return (
    <ActionForm action={syncAdPlatformAction} submitLabel="Sync now" pendingLabel="Syncing…" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="platform" value={platform} />
    </ActionForm>
  );
}
