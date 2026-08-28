import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { MediaThumbnail } from '../../../../components/portal/MediaThumbnail';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { getAllOffices } from '../../../../lib/portal/offices';
import {
  EditNewsForm,
  PublishNowForm,
  ScheduleForm,
  UnpublishForm,
  ArchiveNewsForm,
  RestoreNewsForm,
  DeleteNewsForm,
  RetrySocialPostForm,
  DeleteSocialPostForm,
  SeoForm,
  FeaturedImageForm,
  AddGalleryImageForm,
  TaxonomyForm,
  GenerateAIPackageForm,
  ApplyAISeoForm,
  LinkCampaignForm,
} from './NewsDetailForms';
import styles from '../../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const SOCIAL_STATUS_BADGE: Record<string, string> = {
  POSTED: 'badgeActive',
  MANUAL: 'badgeWarn',
  PENDING: 'badgeWarn',
  FAILED: 'badgeDanger',
};

export default async function AdminNewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireAdminPage();
  const { id } = await params;

  const post = await prisma.newsPost.findUnique({
    where: { id },
    include: {
      socialPosts: { orderBy: { platform: 'asc' } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
      gallery: { include: { asset: true }, orderBy: { sortOrder: 'asc' } },
      featuredImage: true,
    },
  });

  if (!post) notFound();

  const [imageAssets, categories, campaigns, offices] = await Promise.all([
    prisma.mediaAsset.findMany({ where: { kind: 'IMAGE' }, select: { id: true, fileName: true }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.campaign.findMany({ select: { id: true, name: true }, orderBy: { createdAt: 'desc' } }),
    getAllOffices(),
  ]);

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/news" className={styles.backLink}>← All articles</Link>

      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{post.title}</h1>
        <span className={styles.badge}>{post.status}</span>
      </div>
      {post.status === 'PUBLISHED' && (
        <p className={styles.subtitle}>
          Live at <a href={`/insights/news/${post.slug}`} target="_blank" rel="noreferrer">/insights/news/{post.slug}</a>
        </p>
      )}
      {post.status === 'SCHEDULED' && post.publishedAt && (
        <p className={styles.subtitle}>Scheduled for {post.publishedAt.toLocaleString()}</p>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Content</h2>
        <EditNewsForm postId={post.id} title={post.title} excerpt={post.excerpt} body={post.body} publishToOfficeIds={post.publishToOfficeIds} offices={offices} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Featured image &amp; gallery</h2>
        {post.featuredImage && (
          <MediaThumbnail assetId={post.featuredImage.id} alt={post.title} dominantColors={post.featuredImage.dominantColors} />
        )}
        <div className={styles.formSpacer}>
          <FeaturedImageForm key={post.updatedAt.toISOString()} postId={post.id} featuredImageId={post.featuredImageId} ogImageId={post.ogImageId} options={imageAssets} />
        </div>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Gallery</h3>
          <div className={styles.cardList}>
            {post.gallery.length === 0 && <p className={styles.cardMeta}>No gallery images yet.</p>}
            {post.gallery.map((g) => (
              <div key={g.id} className={styles.card}>
                <span className={styles.cardMeta}>{g.asset.fileName}</span>
              </div>
            ))}
          </div>
          <div className={styles.formSpacer}>
            <AddGalleryImageForm postId={post.id} options={imageAssets} />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Campaign</h2>
        <LinkCampaignForm postId={post.id} campaignId={post.campaignId} campaigns={campaigns} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Categories &amp; tags</h2>
        <TaxonomyForm
          postId={post.id}
          categoryOptions={categories}
          selectedCategoryIds={post.categories.map((c) => c.categoryId)}
          currentTags={post.tags.map((t) => t.tag.name)}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>SEO &amp; Open Graph</h2>
        <SeoForm
          postId={post.id}
          values={{
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
            canonicalUrl: post.canonicalUrl,
            ogTitle: post.ogTitle,
            ogDescription: post.ogDescription,
            structuredDataType: post.structuredDataType,
          }}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>AI Marketing Assistant</h2>
        <p className={styles.cardMeta}>
          One click generates an SEO title, meta description, alt text, social caption, hashtags, keywords, a suggested
          CTA, and a marketing summary — reviewed here before anything is applied to the live article.
        </p>
        <div className={styles.formSpacer}>
          <GenerateAIPackageForm postId={post.id} offices={offices} />
        </div>
        {(post.aiSeoTitle || post.aiMarketingSummary) && (
          <div className={styles.card}>
            {post.aiSeoTitle && <p><strong>SEO title:</strong> {post.aiSeoTitle}</p>}
            {post.aiMetaDescription && <p><strong>Meta description:</strong> {post.aiMetaDescription}</p>}
            {post.aiAltText && <p><strong>Alt text:</strong> {post.aiAltText}</p>}
            {post.aiCaption && <p><strong>Caption:</strong> {post.aiCaption}</p>}
            {post.aiSuggestedHashtags.length > 0 && <p><strong>Hashtags:</strong> {post.aiSuggestedHashtags.join(', ')}</p>}
            {post.aiSuggestedKeywords.length > 0 && <p><strong>Keywords:</strong> {post.aiSuggestedKeywords.join(', ')}</p>}
            {post.aiSuggestedCta && <p><strong>Suggested CTA:</strong> {post.aiSuggestedCta}</p>}
            {post.aiMarketingSummary && <p><strong>Marketing summary:</strong> {post.aiMarketingSummary}</p>}
            <ApplyAISeoForm postId={post.id} />
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Publishing</h2>
        <div className={styles.buttonRow}>
          {post.status !== 'PUBLISHED' && post.status !== 'ARCHIVED' && <PublishNowForm postId={post.id} />}
          {post.status === 'PUBLISHED' && <UnpublishForm postId={post.id} />}
        </div>
        {post.status !== 'PUBLISHED' && post.status !== 'ARCHIVED' && (
          <div className={styles.formSpacer}>
            <ScheduleForm postId={post.id} />
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Manage</h2>
        <div className={styles.buttonRow}>
          {post.status !== 'ARCHIVED' && <ArchiveNewsForm postId={post.id} />}
          {post.status === 'ARCHIVED' && <RestoreNewsForm postId={post.id} />}
          {post.status === 'DRAFT' && !post.publishedAt && <DeleteNewsForm postId={post.id} />}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Social packages</h2>
        <p className={styles.cardMeta}>
          Generated once this post is published. Manual mode (the default — no platform credentials are configured) means
          copy-paste packages, not automatic posting.
        </p>
        <div className={styles.cardList}>
          {post.socialPosts.length === 0 && <p className={styles.cardMeta}>Publish this post to generate social packages.</p>}
          {post.socialPosts.map((sp) => (
            <div key={sp.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong>{sp.platform}</strong>
                <span className={`${styles.badge} ${styles[SOCIAL_STATUS_BADGE[sp.status] ?? 'badgeMuted']}`}>{sp.status} · {sp.mode}</span>
              </div>
              {sp.caption && <p className={styles.captionText}>{sp.caption}</p>}
              {sp.permalink && (
                <a href={sp.permalink} target="_blank" rel="noreferrer" className={styles.cardMeta}>
                  {sp.permalink}
                </a>
              )}
              {sp.errorMessage && <span className={styles.errorMessage}>{sp.errorMessage}</span>}
              <div className={styles.buttonRow}>
                <RetrySocialPostForm socialPostId={sp.id} postId={post.id} />
                {sp.status !== 'POSTED' && <DeleteSocialPostForm socialPostId={sp.id} postId={post.id} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
