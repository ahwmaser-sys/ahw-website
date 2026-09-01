'use client';

import {
  updateNewsPost,
  publishNewsPost,
  scheduleNewsPost,
  unpublishNewsPost,
  archiveNewsPost,
  restoreNewsPost,
  deleteNewsPost,
  updateNewsSeo,
  updateNewsFeaturedImage,
  addNewsGalleryImage,
  removeNewsGalleryImage,
  updateNewsTaxonomy,
} from '../../../../lib/portal/actions/news';
import { retrySocialPost, deleteSocialPost } from '../../../../lib/portal/actions/social';
import { linkArticleToCampaign } from '../../../../lib/portal/actions/campaigns';
import { generateArticleAIPackage, applyAISeoSuggestions } from '../../../../lib/portal/actions/ai-content';
import { ActionForm } from '../../../../components/portal/ActionForm';
import { ArticleBodyEditor, type GalleryOption } from './ArticleBodyEditor';
import styles from '../../../../components/portal/portal-ui.module.css';
import type { Office } from '@prisma/client';
import { projects } from '@agp/ui-components';

const PLATFORM_OPTIONS: { value: string; label: string }[] = [
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'GOOGLE_BUSINESS', label: 'Google Business Profile' },
];

export function EditNewsForm({
  postId,
  title,
  excerpt,
  body,
  publishToOfficeIds,
  publishPlatforms,
  relatedProjectSlug,
  offices,
  galleryOptions,
}: {
  postId: string;
  title: string;
  excerpt: string;
  body: string;
  publishToOfficeIds: string[];
  publishPlatforms: string[];
  relatedProjectSlug: string | null;
  offices: readonly Office[];
  galleryOptions: GalleryOption[];
}) {
  const allOffices = publishToOfficeIds.length === 0;
  const allPlatforms = publishPlatforms.length === 0;
  const sortedProjects = [...projects].sort((a, b) => a.title.localeCompare(b.title));
  return (
    <ActionForm action={updateNewsPost} submitLabel="Save changes">
      <input type="hidden" name="postId" value={postId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">Title</label>
        <input className={styles.input} id="title" name="title" defaultValue={title} required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="excerpt">Excerpt</label>
        <input className={styles.input} id="excerpt" name="excerpt" defaultValue={excerpt} required />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Body</span>
        <ArticleBodyEditor initialBody={body} galleryOptions={galleryOptions} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="relatedProjectSlug">Related project</label>
        <select className={styles.select} id="relatedProjectSlug" name="relatedProjectSlug" defaultValue={relatedProjectSlug ?? ''}>
          <option value="">None</option>
          {sortedProjects.map((project) => (
            <option key={project.slug} value={project.slug}>{project.title}</option>
          ))}
        </select>
        <p className={styles.hint}>Shows a linked project card in the article&apos;s &quot;Related&quot; section on the public page.</p>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Publish to</span>
        <div className={styles.checkboxRow}>
          <input
            type="checkbox"
            id="publishToAllOffices"
            defaultChecked={allOffices}
            onChange={(e) => {
              const boxes = e.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[name="publishToOfficeIds"]');
              boxes?.forEach((box) => { box.disabled = e.currentTarget.checked; if (e.currentTarget.checked) box.checked = false; });
            }}
          />
          <label htmlFor="publishToAllOffices">All offices</label>
        </div>
        {offices.map((office) => (
          <div key={office.id} className={styles.checkboxRow}>
            <input
              type="checkbox"
              id={`office-${office.id}`}
              name="publishToOfficeIds"
              value={office.id}
              defaultChecked={publishToOfficeIds.includes(office.id)}
              disabled={allOffices}
            />
            <label htmlFor={`office-${office.id}`}>{office.displayName}</label>
          </div>
        ))}
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Publish on</span>
        <div className={styles.checkboxRow}>
          <input
            type="checkbox"
            id="publishAllPlatforms"
            defaultChecked={allPlatforms}
            onChange={(e) => {
              const boxes = e.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[name="publishPlatforms"]');
              boxes?.forEach((box) => { box.disabled = e.currentTarget.checked; if (e.currentTarget.checked) box.checked = false; });
            }}
          />
          <label htmlFor="publishAllPlatforms">All connected platforms</label>
        </div>
        {PLATFORM_OPTIONS.map((platform) => (
          <div key={platform.value} className={styles.checkboxRow}>
            <input
              type="checkbox"
              id={`platform-${platform.value}`}
              name="publishPlatforms"
              value={platform.value}
              defaultChecked={publishPlatforms.includes(platform.value)}
              disabled={allPlatforms}
            />
            <label htmlFor={`platform-${platform.value}`}>{platform.label}</label>
          </div>
        ))}
      </div>
    </ActionForm>
  );
}

export function PublishNowForm({ postId }: { postId: string }) {
  return (
    <ActionForm action={publishNewsPost} submitLabel="Publish now" pendingLabel="Publishing…">
      <input type="hidden" name="postId" value={postId} />
    </ActionForm>
  );
}

export function ScheduleForm({ postId }: { postId: string }) {
  return (
    <ActionForm action={scheduleNewsPost} submitLabel="Schedule" buttonClassName={styles.buttonSecondary}>
      <input type="hidden" name="postId" value={postId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="publishAt">Publish at</label>
        <input className={styles.input} id="publishAt" name="publishAt" type="datetime-local" required />
      </div>
    </ActionForm>
  );
}

export function UnpublishForm({ postId }: { postId: string }) {
  return (
    <ActionForm action={unpublishNewsPost} submitLabel="Unpublish" buttonClassName={styles.buttonDanger}>
      <input type="hidden" name="postId" value={postId} />
    </ActionForm>
  );
}

export function ArchiveNewsForm({ postId }: { postId: string }) {
  return (
    <ActionForm action={archiveNewsPost} submitLabel="Archive" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="postId" value={postId} />
    </ActionForm>
  );
}

export function RestoreNewsForm({ postId }: { postId: string }) {
  return (
    <ActionForm action={restoreNewsPost} submitLabel="Restore to Draft" className={styles.buttonRow}>
      <input type="hidden" name="postId" value={postId} />
    </ActionForm>
  );
}

export function DeleteNewsForm({ postId }: { postId: string }) {
  return (
    <ActionForm action={deleteNewsPost} submitLabel="Delete draft permanently" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="postId" value={postId} />
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

interface SeoValues {
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  structuredDataType: string;
}

export function SeoForm({ postId, values }: { postId: string; values: SeoValues }) {
  return (
    <ActionForm action={updateNewsSeo} submitLabel="Save SEO settings">
      <input type="hidden" name="postId" value={postId} />
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="metaTitle">Meta title</label>
          <input className={styles.input} id="metaTitle" name="metaTitle" defaultValue={values.metaTitle ?? ''} placeholder="Falls back to the article title" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="structuredDataType">Structured data type</label>
          <select className={styles.select} id="structuredDataType" name="structuredDataType" defaultValue={values.structuredDataType}>
            <option value="NewsArticle">NewsArticle</option>
            <option value="Article">Article</option>
            <option value="BlogPosting">BlogPosting</option>
          </select>
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="metaDescription">Meta description</label>
        <textarea className={styles.textarea} id="metaDescription" name="metaDescription" defaultValue={values.metaDescription ?? ''} placeholder="Falls back to the excerpt" />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="canonicalUrl">Canonical URL (optional)</label>
        <input className={styles.input} id="canonicalUrl" name="canonicalUrl" defaultValue={values.canonicalUrl ?? ''} />
      </div>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ogTitle">Open Graph title (optional)</label>
          <input className={styles.input} id="ogTitle" name="ogTitle" defaultValue={values.ogTitle ?? ''} placeholder="Falls back to meta/article title" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ogDescription">Open Graph description (optional)</label>
          <input className={styles.input} id="ogDescription" name="ogDescription" defaultValue={values.ogDescription ?? ''} />
        </div>
      </div>
    </ActionForm>
  );
}

interface AssetOption {
  id: string;
  fileName: string;
}

interface PreviewUrls {
  linkedin: string;
  facebook: string;
  google: string;
  instagram: string;
  hero: string;
}

export function FeaturedImageForm({
  postId,
  featuredImageId,
  ogImageId,
  options,
  previewUrlsByAsset,
}: {
  postId: string;
  featuredImageId: string | null;
  ogImageId: string | null;
  options: AssetOption[];
  previewUrlsByAsset?: Record<string, PreviewUrls>;
}) {
  if (options.length === 0) {
    return <p className={styles.cardMeta}>Upload an IMAGE asset in the Media Library first.</p>;
  }
  return (
    <ActionForm action={updateNewsFeaturedImage} submitLabel="Save images">
      <input type="hidden" name="postId" value={postId} />
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="featuredImageId">Featured image</label>
          {/* The Social Preview panel above reads these data attributes
              off the selected option on "change" — lets it update the
              per-platform mockups the instant a different photo is
              picked, without a server round trip. */}
          <select className={styles.select} id="featuredImageId" name="featuredImageId" defaultValue={featuredImageId ?? ''}>
            <option value="">None</option>
            {options.map((o) => {
              const preview = previewUrlsByAsset?.[o.id];
              return (
                <option
                  key={o.id}
                  value={o.id}
                  data-linkedin={preview?.linkedin ?? ''}
                  data-facebook={preview?.facebook ?? ''}
                  data-google={preview?.google ?? ''}
                  data-instagram={preview?.instagram ?? ''}
                  data-hero={preview?.hero ?? ''}
                >
                  {o.fileName}
                </option>
              );
            })}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ogImageId">Open Graph image (optional)</label>
          <select className={styles.select} id="ogImageId" name="ogImageId" defaultValue={ogImageId ?? ''}>
            <option value="">None — uses featured image</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.fileName}</option>
            ))}
          </select>
        </div>
      </div>
    </ActionForm>
  );
}

export function AddGalleryImageForm({ postId, options }: { postId: string; options: AssetOption[] }) {
  if (options.length === 0) return null;
  return (
    <ActionForm action={addNewsGalleryImage} submitLabel="Add to gallery" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="postId" value={postId} />
      <select className={styles.select} name="assetId" required>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.fileName}</option>
        ))}
      </select>
    </ActionForm>
  );
}

export function RemoveGalleryImageForm({ postId, galleryImageId }: { postId: string; galleryImageId: string }) {
  return (
    <ActionForm action={removeNewsGalleryImage} submitLabel="Remove" buttonClassName={styles.buttonDanger} className={styles.buttonRow}>
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="galleryImageId" value={galleryImageId} />
    </ActionForm>
  );
}

interface CategoryOption {
  id: string;
  name: string;
}

export function TaxonomyForm({
  postId,
  categoryOptions,
  selectedCategoryIds,
  currentTags,
}: {
  postId: string;
  categoryOptions: CategoryOption[];
  selectedCategoryIds: string[];
  currentTags: string[];
}) {
  return (
    <ActionForm action={updateNewsTaxonomy} submitLabel="Save categories & tags">
      <input type="hidden" name="postId" value={postId} />
      {categoryOptions.length > 0 && (
        <div className={styles.field}>
          <label className={styles.label}>Categories</label>
          <div className={styles.formRow}>
            {categoryOptions.map((c) => (
              <label key={c.id} className={styles.checkboxRow}>
                <input type="checkbox" name="categoryIds" value={c.id} defaultChecked={selectedCategoryIds.includes(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        </div>
      )}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="tags">Tags (comma separated)</label>
        <input className={styles.input} id="tags" name="tags" defaultValue={currentTags.join(', ')} />
      </div>
    </ActionForm>
  );
}

export function LinkCampaignForm({ postId, campaignId, campaigns }: { postId: string; campaignId: string | null; campaigns: { id: string; name: string }[] }) {
  if (campaigns.length === 0) {
    return <p className={styles.cardMeta}>No campaigns yet — create one from the Campaigns page.</p>;
  }
  return (
    <ActionForm action={linkArticleToCampaign} submitLabel="Link campaign" buttonClassName={styles.buttonSecondary} className={styles.buttonRow}>
      <input type="hidden" name="newsPostId" value={postId} />
      <select className={styles.select} name="campaignId" defaultValue={campaignId ?? ''} required>
        <option value="" disabled>Choose a campaign…</option>
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </ActionForm>
  );
}

export function GenerateAIPackageForm({ postId, offices }: { postId: string; offices: readonly Office[] }) {
  return (
    <ActionForm action={generateArticleAIPackage} submitLabel="Generate AI content package" pendingLabel="Generating…">
      <input type="hidden" name="postId" value={postId} />
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ai-officeId">Write for</label>
          <select className={styles.select} id="ai-officeId" name="officeId" defaultValue="">
            <option value="">Global (whole firm, no single office)</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>{office.displayName}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ai-language">Language</label>
          <select className={styles.select} id="ai-language" name="language" defaultValue="en">
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
      </div>
    </ActionForm>
  );
}

export function ApplyAISeoForm({ postId }: { postId: string }) {
  return (
    <ActionForm action={applyAISeoSuggestions} submitLabel="Apply SEO suggestions" buttonClassName={styles.buttonSecondary}>
      <input type="hidden" name="postId" value={postId} />
    </ActionForm>
  );
}
