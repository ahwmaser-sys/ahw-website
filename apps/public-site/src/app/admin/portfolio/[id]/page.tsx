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
  EditMetadataForm,
  ImageSlotUploadForm,
  ClearImageSlotForm,
  EditBriefForm,
  EditDesignForm,
  EditBuildForm,
  EditResultForm,
  EditRelatedForm,
  EditNarrativeForm,
  EditSeoForm,
  AddGalleryImageForm,
  RemoveGalleryImageForm,
  AddFaqItemForm,
  RemoveFaqItemForm,
  PublishForm,
  UnpublishForm,
  DeleteForm,
  PublishToSocialForm,
  RetrySocialPostForm,
  DeleteSocialPostForm,
} from './PortfolioProjectDetailForms';
import styles from '../../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const SOCIAL_STATUS_BADGE: Record<string, string> = {
  POSTED: 'badgeActive',
  MANUAL: 'badgeWarn',
  PENDING: 'badgeWarn',
  FAILED: 'badgeDanger',
};

const SINGULAR_SLOTS = [
  { slot: 'hero' as const, label: 'Hero image' },
  { slot: 'hubFlagship' as const, label: 'Hub — Flagship image' },
  { slot: 'hubPair' as const, label: 'Hub — Pair image' },
  { slot: 'og' as const, label: 'Open Graph (social share) image' },
];

const GALLERY_SECTIONS = [
  { section: 'DESIGN' as const, label: 'Design' },
  { section: 'BUILD' as const, label: 'Build' },
  { section: 'RESULT' as const, label: 'Result' },
];

function SingularImagePreview({ assetId, url, alt }: { assetId: string | null; url: string | null; alt: string }) {
  if (assetId) return <MediaThumbnail assetId={assetId} alt={alt} />;
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of a legacy static path, not an optimizable local asset in this context
    return <img src={url} alt={alt} style={{ maxWidth: 240, maxHeight: 180, objectFit: 'cover' }} />;
  }
  return <p className={styles.cardMeta}>No image set.</p>;
}

export default async function AdminPortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireAdminPage();
  const { id } = await params;

  const project = await prisma.portfolioProject.findUnique({
    where: { id },
    include: {
      galleryImages: { include: { asset: true }, orderBy: { sortOrder: 'asc' } },
      faqItems: { orderBy: { sortOrder: 'asc' } },
      socialPosts: { orderBy: [{ platform: 'asc' }, { officeId: 'asc' }], include: { office: { select: { name: true } } } },
    },
  });
  if (!project) notFound();

  const [otherProjects, offices] = await Promise.all([
    prisma.portfolioProject.findMany({
      where: { id: { not: id } },
      select: { slug: true, title: true },
      orderBy: { title: 'asc' },
    }),
    getAllOffices(),
  ]);

  const imageBySlot: Record<string, { assetId: string | null; url: string | null }> = {
    hero: { assetId: project.heroImageId, url: project.heroImageUrl },
    hubFlagship: { assetId: project.hubFlagshipImageId, url: project.hubFlagshipImageUrl },
    hubPair: { assetId: project.hubPairImageId, url: project.hubPairImageUrl },
    og: { assetId: project.ogImageId, url: project.ogImageUrl },
  };

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/portfolio" className={styles.backLink}>← All portfolio projects</Link>

      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{project.title}</h1>
        <span className={`${styles.badge} ${project.status === 'PUBLISHED' ? styles.badgeActive : styles.badgeMuted}`}>{project.status}</span>
      </div>
      {project.status === 'PUBLISHED' && (
        <p className={styles.subtitle}>
          Live at <a href={`/projects/${project.slug}`} target="_blank" rel="noreferrer">/projects/{project.slug}</a>
        </p>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Metadata</h2>
        <EditMetadataForm
          projectId={project.id}
          title={project.title}
          slug={project.slug}
          sector={project.sector}
          market={project.market}
          tier={project.tier}
          city={project.city}
          area={project.area}
          year={project.year}
          client={project.client}
          stage={project.stage}
          services={project.services}
          resultStatement={project.resultStatement}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Images</h2>
        <div className={styles.cardList}>
          {SINGULAR_SLOTS.map(({ slot, label }) => (
            <div key={slot} className={styles.card}>
              <strong>{label}</strong>
              <SingularImagePreview assetId={imageBySlot[slot]!.assetId} url={imageBySlot[slot]!.url} alt={`${project.title} — ${label}`} />
              <ImageSlotUploadForm projectId={project.id} slot={slot} label={label} />
              {(imageBySlot[slot]!.assetId || imageBySlot[slot]!.url) && <ClearImageSlotForm projectId={project.id} slot={slot} />}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>The Brief</h2>
        <EditBriefForm projectId={project.id} briefClientProblem={project.briefClientProblem} briefDefinitionalSentence={project.briefDefinitionalSentence} />
      </div>

      {GALLERY_SECTIONS.map(({ section, label }) => {
        const images = project.galleryImages.filter((g) => g.section === section);
        return (
          <div key={section} className={styles.section}>
            <h2 className={styles.sectionTitle}>The {label}</h2>
            {section === 'DESIGN' && <EditDesignForm projectId={project.id} designKeyDecision={project.designKeyDecision} designCaption={project.designCaption} />}
            {section === 'BUILD' && (
              <EditBuildForm projectId={project.id} buildDuration={project.buildDuration} buildChallengeResolution={project.buildChallengeResolution} buildFeatures={project.buildFeatures} buildCaption={project.buildCaption} />
            )}
            {section === 'RESULT' && (
              <EditResultForm
                projectId={project.id}
                resultOutcomes={project.resultOutcomes}
                resultClientQuoteText={project.resultClientQuoteText}
                resultClientQuoteAuthor={project.resultClientQuoteAuthor}
                resultCaption={project.resultCaption}
              />
            )}

            <div className={styles.formSpacer}>
              <h3 className={styles.sectionTitle}>{label} gallery</h3>
              <div className={styles.cardList}>
                {images.length === 0 && <p className={styles.cardMeta}>No images yet.</p>}
                {images.map((img) => (
                  <div key={img.id} className={styles.card}>
                    {img.asset ? (
                      <MediaThumbnail assetId={img.asset.id} alt={img.asset.fileName} dominantColors={img.asset.dominantColors} />
                    ) : img.externalUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of a legacy static path
                      <img src={img.externalUrl} alt="" style={{ maxWidth: 200, maxHeight: 150, objectFit: 'cover' }} />
                    ) : null}
                    <RemoveGalleryImageForm projectId={project.id} imageId={img.id} />
                  </div>
                ))}
              </div>
              <AddGalleryImageForm projectId={project.id} section={section} label={label} />
            </div>
          </div>
        );
      })}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Related</h2>
        <EditRelatedForm
          projectId={project.id}
          relatedProjectSlugs={project.relatedProjectSlugs}
          relatedExpertiseTitle={project.relatedExpertiseTitle}
          relatedExpertiseHref={project.relatedExpertiseHref}
          otherProjects={otherProjects}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Narrative</h2>
        <p className={styles.cardMeta}>Optional editorial layer — only shown on the public page when filled in.</p>
        <EditNarrativeForm
          projectId={project.id}
          heroHeadline={project.heroHeadline}
          heroSubtitle={project.heroSubtitle}
          story={project.story}
          designPhilosophy={project.designPhilosophy}
          whyDifferent={project.whyDifferent}
          clientExperience={project.clientExperience}
          ctaHeadline={project.ctaHeadline}
          ctaSubtext={project.ctaSubtext}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>FAQ</h2>
        <div className={styles.cardList}>
          {project.faqItems.length === 0 && <p className={styles.cardMeta}>No FAQ items yet.</p>}
          {project.faqItems.map((item) => (
            <div key={item.id} className={styles.card}>
              <strong>{item.question}</strong>
              <p className={styles.cardMeta}>{item.answer}</p>
              <RemoveFaqItemForm projectId={project.id} faqItemId={item.id} />
            </div>
          ))}
        </div>
        <div className={styles.formSpacer}>
          <AddFaqItemForm projectId={project.id} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>SEO &amp; Open Graph</h2>
        <EditSeoForm
          projectId={project.id}
          seoTitle={project.seoTitle}
          seoDescription={project.seoDescription}
          seoFocusKeyword={project.seoFocusKeyword}
          seoSecondaryKeywords={project.seoSecondaryKeywords}
          seoOgTitle={project.seoOgTitle}
          seoOgDescription={project.seoOgDescription}
          seoTwitterTitle={project.seoTwitterTitle}
          seoTwitterDescription={project.seoTwitterDescription}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Publishing</h2>
        <div className={styles.buttonRow}>
          {project.status !== 'PUBLISHED' && <PublishForm projectId={project.id} />}
          {project.status === 'PUBLISHED' && <UnpublishForm projectId={project.id} />}
        </div>
      </div>

      {principal.roles.includes('SUPER_ADMIN') && project.status !== 'PUBLISHED' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Manage</h2>
          <DeleteForm projectId={project.id} />
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Publish to Social</h2>
        <p className={styles.cardMeta}>
          Announces this project on social — separate from publishing the case-study page itself. Requires a hero image.
        </p>
        <PublishToSocialForm
          projectId={project.id}
          publishToOfficeIds={project.publishToOfficeIds}
          publishPlatforms={project.publishPlatforms}
          offices={offices}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Social packages</h2>
        <p className={styles.cardMeta}>
          Generated once you click Publish to Social above. Manual mode (the default — no platform credentials are
          configured) means copy-paste packages, not automatic posting.
        </p>
        <div className={styles.cardList}>
          {project.socialPosts.length === 0 && <p className={styles.cardMeta}>Publish to social to generate packages.</p>}
          {project.socialPosts.map((sp) => (
            <div key={sp.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong>{sp.platform} — {sp.office.name}</strong>
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
                <RetrySocialPostForm socialPostId={sp.id} postId={project.id} />
                {sp.status !== 'POSTED' && <DeleteSocialPostForm socialPostId={sp.id} postId={project.id} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
