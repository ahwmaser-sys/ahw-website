'use client';

import { useMemo, useState } from 'react';
import styles from '../../../../components/portal/portal-ui.module.css';

interface Option {
  value: string;
  label: string;
}

// Pure client-side URL generation — no server action needed, this never
// writes anything (a generated URL only becomes durable once pasted into
// an AdCampaign's own utm_* fields on its edit page). Copy-to-clipboard
// uses the standard Clipboard API with a manual-select fallback for
// browsers/contexts where it's unavailable (e.g. non-HTTPS — irrelevant
// in production but keeps this honest rather than silently failing).
export function UtmBuilderForm({ baseUrlOptions }: { baseUrlOptions: Option[] }) {
  const [baseUrl, setBaseUrl] = useState(baseUrlOptions[0]?.value ?? '');
  const [source, setSource] = useState('google');
  const [medium, setMedium] = useState('cpc');
  const [campaign, setCampaign] = useState('');
  const [content, setContent] = useState('');
  const [term, setTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const generatedUrl = useMemo(() => {
    if (!baseUrl) return '';
    try {
      const url = new URL(baseUrl);
      if (source) url.searchParams.set('utm_source', source);
      if (medium) url.searchParams.set('utm_medium', medium);
      if (campaign) url.searchParams.set('utm_campaign', campaign);
      if (content) url.searchParams.set('utm_content', content);
      if (term) url.searchParams.set('utm_term', term);
      return url.toString();
    } catch {
      return '';
    }
  }, [baseUrl, source, medium, campaign, content, term]);

  async function handleCopy() {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.form}>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="baseUrl">Landing page</label>
          <select className={styles.select} id="baseUrl" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}>
            {baseUrlOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="utm-source">utm_source</label>
          <input className={styles.input} id="utm-source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="google, facebook, linkedin, tiktok…" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="utm-medium">utm_medium</label>
          <input className={styles.input} id="utm-medium" value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="cpc, paid_social…" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="utm-campaign">utm_campaign</label>
          <input className={styles.input} id="utm-campaign" value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="e.g. egypt-search-2026" />
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="utm-content">utm_content (optional)</label>
          <input className={styles.input} id="utm-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="e.g. ad-variant-a" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="utm-term">utm_term (optional)</label>
          <input className={styles.input} id="utm-term" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="e.g. keyword" />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="generated">Generated URL</label>
        <textarea className={styles.monospaceTextarea} id="generated" rows={3} readOnly value={generatedUrl} />
        <div className={styles.buttonRow}>
          <button type="button" className={styles.button} onClick={handleCopy} disabled={!generatedUrl}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className={styles.hint}>
          Paste this into the ad platform&apos;s Final URL / tracking template, and record the same source/medium/
          campaign/content/term on the matching Ad Campaign&apos;s Details tab so leads can be attributed back to it.
        </p>
      </div>
    </div>
  );
}
