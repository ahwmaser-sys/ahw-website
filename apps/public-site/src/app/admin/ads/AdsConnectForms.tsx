'use client';

import { completeGoogleAdsConnection, completeMetaAdsConnection, completeLinkedInAdsConnection, completeTikTokAdsConnection, syncAdPlatformAction } from '../../../lib/portal/actions/ads';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';

// Company-wide variant of settings/integrations/ConnectForms.tsx's
// OAuthConnectLink. officeId is optional here (unlike the social
// version, where it's always required): omitted connects one shared
// account across every market, provided connects a market-scoped
// account instead — both use the exact same generic
// `/api/portal/integrations/oauth/[type]/start` route.
export function AdOAuthConnectLink({ type, officeId }: { type: string; officeId?: string | undefined }) {
  return (
    <a href={`/api/portal/integrations/oauth/${type}/start${officeId ? `?officeId=${officeId}` : ''}`} className={styles.button}>
      Connect via OAuth
    </a>
  );
}

export function GoogleAdsFollowUpForm({ officeId }: { officeId?: string | undefined }) {
  return (
    <ActionForm action={completeGoogleAdsConnection} submitLabel="Finish setup">
      {officeId && <input type="hidden" name="officeId" value={officeId} />}
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`ga-customerId${officeId ?? ''}`}>Google Ads Customer ID</label>
        <input className={styles.input} id={`ga-customerId${officeId ?? ''}`} name="customerId" placeholder="e.g. 123-456-7890" required />
        <p className={styles.hint}>Found top-right in the Google Ads UI. The AW- conversion ID (AW-18370654415) is usually the same account, but confirm here rather than assuming.</p>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`ga-loginCustomerId${officeId ?? ''}`}>Manager (MCC) account ID — optional</label>
        <input className={styles.input} id={`ga-loginCustomerId${officeId ?? ''}`} name="loginCustomerId" placeholder="Only if this account is managed under an MCC" />
      </div>
    </ActionForm>
  );
}

export function MetaAdsFollowUpForm({ officeId }: { officeId?: string | undefined }) {
  return (
    <ActionForm action={completeMetaAdsConnection} submitLabel="Finish setup">
      {officeId && <input type="hidden" name="officeId" value={officeId} />}
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`meta-adAccountId${officeId ?? ''}`}>Meta Ad Account ID</label>
        <input className={styles.input} id={`meta-adAccountId${officeId ?? ''}`} name="adAccountId" placeholder="e.g. act_123456789 or 123456789" required />
      </div>
    </ActionForm>
  );
}

export function LinkedInAdsFollowUpForm({ officeId }: { officeId?: string | undefined }) {
  return (
    <ActionForm action={completeLinkedInAdsConnection} submitLabel="Finish setup">
      {officeId && <input type="hidden" name="officeId" value={officeId} />}
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`li-adAccountId${officeId ?? ''}`}>LinkedIn Ad Account ID</label>
        <input className={styles.input} id={`li-adAccountId${officeId ?? ''}`} name="adAccountId" placeholder="e.g. 123456789" required />
      </div>
    </ActionForm>
  );
}

export function TikTokAdsFollowUpForm({ officeId }: { officeId?: string | undefined }) {
  return (
    <ActionForm action={completeTikTokAdsConnection} submitLabel="Finish setup">
      {officeId && <input type="hidden" name="officeId" value={officeId} />}
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`tt-advertiserId${officeId ?? ''}`}>TikTok Advertiser ID</label>
        <input className={styles.input} id={`tt-advertiserId${officeId ?? ''}`} name="advertiserId" placeholder="e.g. 1234567890123456789" required />
      </div>
    </ActionForm>
  );
}

export function SyncNowForm({ platform, officeId }: { platform: string; officeId?: string | undefined }) {
  return (
    <ActionForm action={syncAdPlatformAction} submitLabel="Sync now" pendingLabel="Syncing…" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="platform" value={platform} />
      {officeId && <input type="hidden" name="officeId" value={officeId} />}
    </ActionForm>
  );
}
