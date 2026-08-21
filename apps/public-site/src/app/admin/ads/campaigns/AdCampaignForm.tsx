'use client';

import { createAdCampaign, updateAdCampaign } from '../../../../lib/portal/actions/ads';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';

interface Option {
  id: string;
  label: string;
}

interface AdCampaignFormValues {
  id?: string;
  platform?: string;
  market?: string;
  officeId?: string | null;
  name?: string;
  campaignType?: string | null;
  landingPageId?: string | null;
  contentCampaignId?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  budgetAmount?: number | null;
  budgetCurrency?: string | null;
  budgetType?: string | null;
  conversionReference?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  notes?: string | null;
}

function toDateInput(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : '';
}

// Shared by both /admin/ads/campaigns/new and /admin/ads/campaigns/[id] —
// `initial` present means edit (submits updateAdCampaign with a hidden
// id), absent means create.
export function AdCampaignForm({ initial, offices, landingPages, contentCampaigns }: { initial?: AdCampaignFormValues; offices: Option[]; landingPages: Option[]; contentCampaigns: Option[] }) {
  const isEdit = Boolean(initial?.id);
  return (
    <ActionForm action={isEdit ? updateAdCampaign : createAdCampaign} submitLabel={isEdit ? 'Save changes' : 'Create campaign'}>
      {isEdit && <input type="hidden" name="id" value={initial?.id} />}

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="platform">Platform</label>
          <select className={styles.select} id="platform" name="platform" defaultValue={initial?.platform ?? 'GOOGLE_ADS'} disabled={isEdit} required>
            <option value="GOOGLE_ADS">Google Ads</option>
            <option value="META_ADS">Meta Ads</option>
            <option value="LINKEDIN_ADS">LinkedIn Ads</option>
            <option value="TIKTOK_ADS">TikTok Ads</option>
          </select>
          {isEdit && <input type="hidden" name="platform" value={initial?.platform} />}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Name</label>
          <input className={styles.input} id="name" name="name" defaultValue={initial?.name ?? ''} required />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="market">Market</label>
          <input className={styles.input} id="market" name="market" defaultValue={initial?.market ?? ''} placeholder="e.g. Egypt, Kuwait, Egypt + Kuwait" required />
          <p className={styles.hint}>Free text — new markets never require a code change.</p>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="officeId">Office (optional)</label>
          <select className={styles.select} id="officeId" name="officeId" defaultValue={initial?.officeId ?? ''}>
            <option value="">— None —</option>
            {offices.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="campaignType">Campaign type</label>
          <input className={styles.input} id="campaignType" name="campaignType" defaultValue={initial?.campaignType ?? ''} placeholder="e.g. Search, Performance Max, Sponsored Content" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="conversionReference">Conversion reference</label>
          <input
            className={styles.input}
            id="conversionReference"
            name="conversionReference"
            defaultValue={initial?.conversionReference ?? ''}
            placeholder="e.g. AW-18370654415/NlhrCP6-neUcEM_h57dE (Phone Click – Website)"
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="landingPageId">Landing page (optional)</label>
          <select className={styles.select} id="landingPageId" name="landingPageId" defaultValue={initial?.landingPageId ?? ''}>
            <option value="">— None —</option>
            {landingPages.map((lp) => (
              <option key={lp.id} value={lp.id}>{lp.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contentCampaignId">Content campaign (optional)</label>
          <select className={styles.select} id="contentCampaignId" name="contentCampaignId" defaultValue={initial?.contentCampaignId ?? ''}>
            <option value="">— None —</option>
            {contentCampaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <p className={styles.hint}>The existing content-grouping Campaign (articles/social/graphics), if this ad campaign is promoting one.</p>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="startDate">Start date</label>
          <input className={styles.input} id="startDate" name="startDate" type="date" defaultValue={toDateInput(initial?.startDate)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="endDate">End date</label>
          <input className={styles.input} id="endDate" name="endDate" type="date" defaultValue={toDateInput(initial?.endDate)} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="budgetAmount">Budget amount</label>
          <input className={styles.input} id="budgetAmount" name="budgetAmount" type="number" step="0.01" min="0" defaultValue={initial?.budgetAmount ?? ''} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="budgetCurrency">Currency</label>
          <input className={styles.input} id="budgetCurrency" name="budgetCurrency" defaultValue={initial?.budgetCurrency ?? ''} placeholder="USD, EGP, KWD…" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="budgetType">Budget type</label>
          <select className={styles.select} id="budgetType" name="budgetType" defaultValue={initial?.budgetType ?? ''}>
            <option value="">— Unspecified —</option>
            <option value="daily">Daily</option>
            <option value="lifetime">Lifetime</option>
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>UTM (for this campaign&apos;s ad platform tracking template)</h2>
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="utmSource">utm_source</label>
            <input className={styles.input} id="utmSource" name="utmSource" defaultValue={initial?.utmSource ?? ''} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="utmMedium">utm_medium</label>
            <input className={styles.input} id="utmMedium" name="utmMedium" defaultValue={initial?.utmMedium ?? ''} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="utmCampaign">utm_campaign</label>
            <input className={styles.input} id="utmCampaign" name="utmCampaign" defaultValue={initial?.utmCampaign ?? ''} />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="utmContent">utm_content</label>
            <input className={styles.input} id="utmContent" name="utmContent" defaultValue={initial?.utmContent ?? ''} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="utmTerm">utm_term</label>
            <input className={styles.input} id="utmTerm" name="utmTerm" defaultValue={initial?.utmTerm ?? ''} />
          </div>
        </div>
        <p className={styles.hint}>Use the <a href="/admin/ads/utm">UTM Builder</a> to generate the full tracking URL from these values.</p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="notes">Notes</label>
        <textarea className={styles.textarea} id="notes" name="notes" rows={4} defaultValue={initial?.notes ?? ''} />
      </div>
    </ActionForm>
  );
}
