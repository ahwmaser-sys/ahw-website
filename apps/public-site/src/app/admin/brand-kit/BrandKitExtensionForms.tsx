'use client';

import {
  updateCompanyInfo,
  updateWebsiteDomain,
  updateDefaultCta,
  updateDefaultHashtags,
  updateBrandVoice,
  updateFooterSettings,
} from '../../../lib/portal/actions/brand-kit';
import { ActionForm } from '../../../components/portal/ActionForm';
import styles from '../../../components/portal/portal-ui.module.css';
import type { BrandCompanyInfo, BrandDefaultCta, BrandFooterSettings } from '../../../lib/portal/brand-kit';

export function CompanyInfoForm({ info }: { info: BrandCompanyInfo }) {
  return (
    <ActionForm action={updateCompanyInfo} submitLabel="Save">
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="legalName">Legal name</label>
          <input className={styles.input} id="legalName" name="legalName" defaultValue={info.legalName} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="tagline">Tagline</label>
          <input className={styles.input} id="tagline" name="tagline" defaultValue={info.tagline} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="founded">Founded</label>
          <input className={styles.input} id="founded" name="founded" defaultValue={info.founded} placeholder="e.g. 2010" />
        </div>
      </div>
    </ActionForm>
  );
}

export function WebsiteDomainForm({ websiteUrl }: { websiteUrl: string }) {
  return (
    <ActionForm action={updateWebsiteDomain} submitLabel="Save">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="websiteUrl">Website domain</label>
        <input className={styles.input} id="websiteUrl" name="websiteUrl" type="url" defaultValue={websiteUrl} placeholder="https://ahwspaces.com" required />
      </div>
    </ActionForm>
  );
}

export function DefaultCtaForm({ cta }: { cta: BrandDefaultCta }) {
  return (
    <ActionForm action={updateDefaultCta} submitLabel="Save">
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cta-label">Label</label>
          <input className={styles.input} id="cta-label" name="label" defaultValue={cta.label} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cta-url">URL</label>
          <input className={styles.input} id="cta-url" name="url" defaultValue={cta.url} required />
        </div>
      </div>
    </ActionForm>
  );
}

export function DefaultHashtagsForm({ hashtags }: { hashtags: string[] }) {
  return (
    <ActionForm action={updateDefaultHashtags} submitLabel="Save">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="hashtags">Default hashtags (comma-separated)</label>
        <input className={styles.input} id="hashtags" name="hashtags" defaultValue={hashtags.join(', ')} placeholder="AHWArchitects, Architecture, InteriorDesign" />
      </div>
    </ActionForm>
  );
}

export function BrandVoiceForm({ brandVoice, emailSignature }: { brandVoice: string | null; emailSignature: string | null }) {
  return (
    <ActionForm action={updateBrandVoice} submitLabel="Save">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="brandVoice">Brand voice</label>
        <textarea className={styles.textarea} id="brandVoice" name="brandVoice" rows={4} defaultValue={brandVoice ?? ''} placeholder="e.g. Confident, precise, understated luxury — never hyperbolic." />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="emailSignature">Email signature</label>
        <textarea className={styles.textarea} id="emailSignature" name="emailSignature" rows={4} defaultValue={emailSignature ?? ''} />
      </div>
    </ActionForm>
  );
}

export function FooterSettingsForm({ settings }: { settings: BrandFooterSettings }) {
  return (
    <ActionForm action={updateFooterSettings} submitLabel="Save">
      <div className={styles.field}>
        <label className={styles.label} htmlFor="copyrightText">Copyright text</label>
        <input className={styles.input} id="copyrightText" name="copyrightText" defaultValue={settings.copyrightText} required />
      </div>
      <label className={styles.checkboxRow}>
        <input type="checkbox" name="showLegalLinks" value="true" defaultChecked={settings.showLegalLinks} />
        Show legal links (Privacy Policy / Terms of Service)
      </label>
      <input type="hidden" name="showLegalLinks" value="false" />
    </ActionForm>
  );
}
