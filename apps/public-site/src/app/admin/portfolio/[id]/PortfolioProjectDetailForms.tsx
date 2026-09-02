'use client';

import {
  updatePortfolioProjectMetadata,
  updatePortfolioProjectBrief,
  updatePortfolioProjectDesign,
  updatePortfolioProjectBuild,
  updatePortfolioProjectResult,
  updatePortfolioProjectRelated,
  updatePortfolioProjectNarrative,
  updatePortfolioProjectSeo,
  setPortfolioProjectSingularImage,
  clearPortfolioProjectSingularImage,
  addPortfolioProjectGalleryImage,
  removePortfolioProjectGalleryImage,
  addPortfolioProjectFaqItem,
  removePortfolioProjectFaqItem,
  publishPortfolioProjectToSocial,
  publishPortfolioProject,
  unpublishPortfolioProject,
  deletePortfolioProject,
} from '../../../../lib/portal/actions/portfolio';
import { retrySocialPost, deleteSocialPost } from '../../../../lib/portal/actions/social';
import { ActionForm } from '../../../../components/portal/ActionForm';
import styles from '../../../../components/portal/portal-ui.module.css';
import type { Office } from '@prisma/client';

const SECTOR_OPTIONS = ['RESIDENTIAL', 'COMMERCIAL', 'HOSPITALITY', 'WORKPLACE', 'RETAIL'];
const PLATFORM_OPTIONS: { value: string; label: string }[] = [
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'GOOGLE_BUSINESS', label: 'Google Business Profile' },
];
const MARKET_OPTIONS = ['EGYPT', 'KUWAIT', 'UAE', 'LEBANON'];
const TIER_OPTIONS = ['FLAGSHIP', 'STANDARD'];

export function EditMetadataForm({
  projectId,
  title,
  slug,
  sector,
  market,
  tier,
  city,
  area,
  year,
  client,
  stage,
  services,
  resultStatement,
}: {
  projectId: string;
  title: string;
  slug: string;
  sector: string;
  market: string;
  tier: string;
  city: string;
  area: string;
  year: string;
  client: string | null;
  stage: string | null;
  services: string[];
  resultStatement: string | null;
}) {
  return (
    <ActionForm action={updatePortfolioProjectMetadata} submitLabel="Save changes">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">Title</label>
        <input className={styles.input} id="title" name="title" defaultValue={title} required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="slug">URL slug</label>
        <input className={styles.input} id="slug" name="slug" defaultValue={slug} required />
        <p className={styles.hint}>Public URL: /projects/{slug}. Changing this moves the live page — old links will 404.</p>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="sector">Sector</label>
        <select className={styles.select} id="sector" name="sector" defaultValue={sector}>
          {SECTOR_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="market">Market (office)</label>
        <select className={styles.select} id="market" name="market" defaultValue={market}>
          {MARKET_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="tier">Tier</label>
        <select className={styles.select} id="tier" name="tier" defaultValue={tier}>
          {TIER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="city">City</label>
        <input className={styles.input} id="city" name="city" defaultValue={city} required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="area">Area (sqm)</label>
        <input className={styles.input} id="area" name="area" defaultValue={area} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="year">Year</label>
        <input className={styles.input} id="year" name="year" defaultValue={year} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="client">Client</label>
        <input className={styles.input} id="client" name="client" defaultValue={client ?? ''} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="stage">Delivery stage</label>
        <input className={styles.input} id="stage" name="stage" defaultValue={stage ?? ''} placeholder="Completed, Design Phase, Ongoing..." />
        <p className={styles.hint}>Shown on the homepage&apos;s Selected Work grid.</p>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="services">Services (comma-separated)</label>
        <input className={styles.input} id="services" name="services" defaultValue={services.join(', ')} placeholder="Architecture, Interior Design, Landscape..." />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="resultStatement">Result statement</label>
        <textarea className={styles.textarea} id="resultStatement" name="resultStatement" defaultValue={resultStatement ?? ''} rows={2} />
      </div>
    </ActionForm>
  );
}

// One reusable pair for all four singular image slots (Hero, Hub
// Flagship, Hub Pair, OG) — upload-and-attach in one submit, mirroring
// the same MediaAsset pipeline admin/media's own upload form uses.
export function ImageSlotUploadForm({ projectId, slot, label }: { projectId: string; slot: 'hero' | 'hubFlagship' | 'hubPair' | 'og'; label: string }) {
  return (
    <ActionForm action={setPortfolioProjectSingularImage} submitLabel={`Upload ${label}`} pendingLabel="Uploading…" className={styles.formSpacer}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="slot" value={slot} />
      <input type="file" name="file" accept="image/*" required />
    </ActionForm>
  );
}

export function ClearImageSlotForm({ projectId, slot }: { projectId: string; slot: 'hero' | 'hubFlagship' | 'hubPair' | 'og' }) {
  return (
    <ActionForm action={clearPortfolioProjectSingularImage} submitLabel="Clear" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="slot" value={slot} />
    </ActionForm>
  );
}

export function EditBriefForm({ projectId, briefClientProblem, briefDefinitionalSentence }: { projectId: string; briefClientProblem: string | null; briefDefinitionalSentence: string | null }) {
  return (
    <ActionForm action={updatePortfolioProjectBrief} submitLabel="Save changes">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="briefDefinitionalSentence">Definitional sentence</label>
        <input className={styles.input} id="briefDefinitionalSentence" name="briefDefinitionalSentence" defaultValue={briefDefinitionalSentence ?? ''} placeholder="One-line summary of the project" />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="briefClientProblem">Client problem</label>
        <textarea className={styles.textarea} id="briefClientProblem" name="briefClientProblem" defaultValue={briefClientProblem ?? ''} rows={3} />
      </div>
    </ActionForm>
  );
}

export function EditDesignForm({ projectId, designKeyDecision, designCaption }: { projectId: string; designKeyDecision: string | null; designCaption: string | null }) {
  return (
    <ActionForm action={updatePortfolioProjectDesign} submitLabel="Save changes">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="designKeyDecision">Key decision</label>
        <textarea className={styles.textarea} id="designKeyDecision" name="designKeyDecision" defaultValue={designKeyDecision ?? ''} rows={3} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="designCaption">Image caption</label>
        <input className={styles.input} id="designCaption" name="designCaption" defaultValue={designCaption ?? ''} placeholder="Caption for the design image group" />
      </div>
    </ActionForm>
  );
}

export function EditBuildForm({
  projectId,
  buildDuration,
  buildChallengeResolution,
  buildFeatures,
  buildCaption,
}: {
  projectId: string;
  buildDuration: string | null;
  buildChallengeResolution: string | null;
  buildFeatures: string[];
  buildCaption: string | null;
}) {
  return (
    <ActionForm action={updatePortfolioProjectBuild} submitLabel="Save changes">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="buildDuration">Duration</label>
        <input className={styles.input} id="buildDuration" name="buildDuration" defaultValue={buildDuration ?? ''} placeholder="6 Months, Ongoing..." />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="buildChallengeResolution">Challenge & resolution</label>
        <textarea className={styles.textarea} id="buildChallengeResolution" name="buildChallengeResolution" defaultValue={buildChallengeResolution ?? ''} rows={3} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="buildFeatures">Features (comma-separated)</label>
        <input className={styles.input} id="buildFeatures" name="buildFeatures" defaultValue={buildFeatures.join(', ')} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="buildCaption">Image caption</label>
        <input className={styles.input} id="buildCaption" name="buildCaption" defaultValue={buildCaption ?? ''} />
      </div>
    </ActionForm>
  );
}

export function EditResultForm({
  projectId,
  resultOutcomes,
  resultClientQuoteText,
  resultClientQuoteAuthor,
  resultCaption,
}: {
  projectId: string;
  resultOutcomes: string[];
  resultClientQuoteText: string | null;
  resultClientQuoteAuthor: string | null;
  resultCaption: string | null;
}) {
  return (
    <ActionForm action={updatePortfolioProjectResult} submitLabel="Save changes">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="resultOutcomes">Outcomes (comma-separated)</label>
        <input className={styles.input} id="resultOutcomes" name="resultOutcomes" defaultValue={resultOutcomes.join(', ')} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="resultClientQuoteText">Client quote</label>
        <textarea className={styles.textarea} id="resultClientQuoteText" name="resultClientQuoteText" defaultValue={resultClientQuoteText ?? ''} rows={2} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="resultClientQuoteAuthor">Quote author</label>
        <input className={styles.input} id="resultClientQuoteAuthor" name="resultClientQuoteAuthor" defaultValue={resultClientQuoteAuthor ?? ''} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="resultCaption">Image caption</label>
        <input className={styles.input} id="resultCaption" name="resultCaption" defaultValue={resultCaption ?? ''} />
      </div>
    </ActionForm>
  );
}

export function EditRelatedForm({
  projectId,
  relatedProjectSlugs,
  relatedExpertiseTitle,
  relatedExpertiseHref,
  otherProjects,
}: {
  projectId: string;
  relatedProjectSlugs: string[];
  relatedExpertiseTitle: string | null;
  relatedExpertiseHref: string | null;
  otherProjects: { slug: string; title: string }[];
}) {
  return (
    <ActionForm action={updatePortfolioProjectRelated} submitLabel="Save changes">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="relatedProjectSlugs">Related projects</label>
        <select className={styles.select} id="relatedProjectSlugs" name="relatedProjectSlugs" multiple size={6} defaultValue={relatedProjectSlugs}>
          {otherProjects.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
        </select>
        <p className={styles.hint}>Cmd/Ctrl-click to select more than one.</p>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="relatedExpertiseTitle">Related expertise — title</label>
        <input className={styles.input} id="relatedExpertiseTitle" name="relatedExpertiseTitle" defaultValue={relatedExpertiseTitle ?? ''} placeholder="Residential Architecture" />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="relatedExpertiseHref">Related expertise — link</label>
        <input className={styles.input} id="relatedExpertiseHref" name="relatedExpertiseHref" defaultValue={relatedExpertiseHref ?? ''} placeholder="/expertise/architecture" />
      </div>
    </ActionForm>
  );
}

export function EditNarrativeForm({
  projectId,
  heroHeadline,
  heroSubtitle,
  story,
  designPhilosophy,
  whyDifferent,
  clientExperience,
  ctaHeadline,
  ctaSubtext,
}: {
  projectId: string;
  heroHeadline: string | null;
  heroSubtitle: string | null;
  story: string[];
  designPhilosophy: string | null;
  whyDifferent: string | null;
  clientExperience: string[];
  ctaHeadline: string | null;
  ctaSubtext: string | null;
}) {
  return (
    <ActionForm action={updatePortfolioProjectNarrative} submitLabel="Save changes">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="heroHeadline">Hero headline</label>
        <input className={styles.input} id="heroHeadline" name="heroHeadline" defaultValue={heroHeadline ?? ''} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="heroSubtitle">Hero subtitle</label>
        <textarea className={styles.textarea} id="heroSubtitle" name="heroSubtitle" defaultValue={heroSubtitle ?? ''} rows={2} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="story">Story (one paragraph per line)</label>
        <textarea className={styles.textarea} id="story" name="story" defaultValue={story.join('\n')} rows={6} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="designPhilosophy">Design philosophy</label>
        <textarea className={styles.textarea} id="designPhilosophy" name="designPhilosophy" defaultValue={designPhilosophy ?? ''} rows={3} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="whyDifferent">Why this project is different</label>
        <textarea className={styles.textarea} id="whyDifferent" name="whyDifferent" defaultValue={whyDifferent ?? ''} rows={3} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="clientExperience">Client experience (one bullet per line)</label>
        <textarea className={styles.textarea} id="clientExperience" name="clientExperience" defaultValue={clientExperience.join('\n')} rows={4} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="ctaHeadline">Closing CTA headline</label>
        <input className={styles.input} id="ctaHeadline" name="ctaHeadline" defaultValue={ctaHeadline ?? ''} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="ctaSubtext">Closing CTA subtext</label>
        <input className={styles.input} id="ctaSubtext" name="ctaSubtext" defaultValue={ctaSubtext ?? ''} />
      </div>
    </ActionForm>
  );
}

export function EditSeoForm({
  projectId,
  seoTitle,
  seoDescription,
  seoFocusKeyword,
  seoSecondaryKeywords,
  seoOgTitle,
  seoOgDescription,
  seoTwitterTitle,
  seoTwitterDescription,
}: {
  projectId: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoFocusKeyword: string | null;
  seoSecondaryKeywords: string[];
  seoOgTitle: string | null;
  seoOgDescription: string | null;
  seoTwitterTitle: string | null;
  seoTwitterDescription: string | null;
}) {
  return (
    <ActionForm action={updatePortfolioProjectSeo} submitLabel="Save changes">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="seoTitle">SEO title</label>
        <input className={styles.input} id="seoTitle" name="seoTitle" defaultValue={seoTitle ?? ''} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="seoDescription">SEO description</label>
        <textarea className={styles.textarea} id="seoDescription" name="seoDescription" defaultValue={seoDescription ?? ''} rows={2} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="seoFocusKeyword">Focus keyword</label>
        <input className={styles.input} id="seoFocusKeyword" name="seoFocusKeyword" defaultValue={seoFocusKeyword ?? ''} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="seoSecondaryKeywords">Secondary keywords (comma-separated)</label>
        <input className={styles.input} id="seoSecondaryKeywords" name="seoSecondaryKeywords" defaultValue={seoSecondaryKeywords.join(', ')} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="seoOgTitle">Open Graph title</label>
        <input className={styles.input} id="seoOgTitle" name="seoOgTitle" defaultValue={seoOgTitle ?? ''} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="seoOgDescription">Open Graph description</label>
        <textarea className={styles.textarea} id="seoOgDescription" name="seoOgDescription" defaultValue={seoOgDescription ?? ''} rows={2} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="seoTwitterTitle">Twitter title</label>
        <input className={styles.input} id="seoTwitterTitle" name="seoTwitterTitle" defaultValue={seoTwitterTitle ?? ''} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="seoTwitterDescription">Twitter description</label>
        <textarea className={styles.textarea} id="seoTwitterDescription" name="seoTwitterDescription" defaultValue={seoTwitterDescription ?? ''} rows={2} />
      </div>
    </ActionForm>
  );
}

export function AddGalleryImageForm({ projectId, section, label }: { projectId: string; section: 'DESIGN' | 'BUILD' | 'RESULT'; label: string }) {
  return (
    <ActionForm action={addPortfolioProjectGalleryImage} submitLabel={`Add to ${label}`} pendingLabel="Uploading…" className={styles.formSpacer}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="section" value={section} />
      <input type="file" name="file" accept="image/*" required />
    </ActionForm>
  );
}

export function RemoveGalleryImageForm({ projectId, imageId }: { projectId: string; imageId: string }) {
  return (
    <ActionForm action={removePortfolioProjectGalleryImage} submitLabel="Remove" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="imageId" value={imageId} />
    </ActionForm>
  );
}

export function AddFaqItemForm({ projectId }: { projectId: string }) {
  return (
    <ActionForm action={addPortfolioProjectFaqItem} submitLabel="Add FAQ item">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="question">Question</label>
        <input className={styles.input} id="question" name="question" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="answer">Answer</label>
        <textarea className={styles.textarea} id="answer" name="answer" rows={2} required />
      </div>
    </ActionForm>
  );
}

export function RemoveFaqItemForm({ projectId, faqItemId }: { projectId: string; faqItemId: string }) {
  return (
    <ActionForm action={removePortfolioProjectFaqItem} submitLabel="Remove" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="faqItemId" value={faqItemId} />
    </ActionForm>
  );
}

export function PublishForm({ projectId }: { projectId: string }) {
  return (
    <ActionForm action={publishPortfolioProject} submitLabel="Publish" className={styles.buttonRow}>
      <input type="hidden" name="projectId" value={projectId} />
    </ActionForm>
  );
}

export function UnpublishForm({ projectId }: { projectId: string }) {
  return (
    <ActionForm action={unpublishPortfolioProject} submitLabel="Unpublish" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="projectId" value={projectId} />
    </ActionForm>
  );
}

export function DeleteForm({ projectId }: { projectId: string }) {
  return (
    <ActionForm action={deletePortfolioProject} submitLabel="Delete" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="projectId" value={projectId} />
    </ActionForm>
  );
}

export function PublishToSocialForm({
  projectId,
  publishToOfficeIds,
  publishPlatforms,
  offices,
}: {
  projectId: string;
  publishToOfficeIds: string[];
  publishPlatforms: string[];
  offices: readonly Office[];
}) {
  const allOffices = publishToOfficeIds.length === 0;
  const allPlatforms = publishPlatforms.length === 0;
  return (
    <ActionForm action={publishPortfolioProjectToSocial} submitLabel="Publish to Social" pendingLabel="Publishing…">
      <input type="hidden" name="projectId" value={projectId} />
      <div className={styles.field}>
        <span className={styles.label}>Publish to</span>
        <div className={styles.checkboxRow}>
          <input
            type="checkbox"
            id="socialAllOffices"
            defaultChecked={allOffices}
            onChange={(e) => {
              const boxes = e.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[name="publishToOfficeIds"]');
              boxes?.forEach((box) => { box.disabled = e.currentTarget.checked; if (e.currentTarget.checked) box.checked = false; });
            }}
          />
          <label htmlFor="socialAllOffices">All offices</label>
        </div>
        {offices.map((office) => (
          <div key={office.id} className={styles.checkboxRow}>
            <input
              type="checkbox"
              id={`social-office-${office.id}`}
              name="publishToOfficeIds"
              value={office.id}
              defaultChecked={publishToOfficeIds.includes(office.id)}
              disabled={allOffices}
            />
            <label htmlFor={`social-office-${office.id}`}>{office.displayName}</label>
          </div>
        ))}
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Platforms</span>
        <div className={styles.checkboxRow}>
          <input
            type="checkbox"
            id="socialAllPlatforms"
            defaultChecked={allPlatforms}
            onChange={(e) => {
              const boxes = e.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[name="publishPlatforms"]');
              boxes?.forEach((box) => { box.disabled = e.currentTarget.checked; if (e.currentTarget.checked) box.checked = false; });
            }}
          />
          <label htmlFor="socialAllPlatforms">All connected platforms</label>
        </div>
        {PLATFORM_OPTIONS.map((platform) => (
          <div key={platform.value} className={styles.checkboxRow}>
            <input
              type="checkbox"
              id={`social-platform-${platform.value}`}
              name="publishPlatforms"
              value={platform.value}
              defaultChecked={publishPlatforms.includes(platform.value)}
              disabled={allPlatforms}
            />
            <label htmlFor={`social-platform-${platform.value}`}>{platform.label}</label>
          </div>
        ))}
      </div>
    </ActionForm>
  );
}

export function RetrySocialPostForm({ socialPostId, postId }: { socialPostId: string; postId: string }) {
  return (
    <ActionForm action={retrySocialPost} submitLabel="Regenerate / retry" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="socialPostId" value={socialPostId} />
      <input type="hidden" name="postId" value={postId} />
    </ActionForm>
  );
}

export function DeleteSocialPostForm({ socialPostId, postId }: { socialPostId: string; postId: string }) {
  return (
    <ActionForm action={deleteSocialPost} submitLabel="Remove" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="socialPostId" value={socialPostId} />
      <input type="hidden" name="postId" value={postId} />
    </ActionForm>
  );
}
