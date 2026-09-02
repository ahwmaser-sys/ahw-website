import { prisma } from '../db';
import { socialAdapters } from './adapter';
import { isPubliclyVisible } from '../media/public-visibility';
import { recordIntegrationPublish } from '../integrations/store';
import { getSiteUrl } from '../../site-config';
import type { SocialAdapter } from './types';

// Each platform gets the smart-cropped variant the upload pipeline
// already generates for it (media/output-targets.ts) instead of the raw
// original — sending the same uncropped photo to every platform is what
// produced the letterboxed Google Business post (a 1200x900 slot fed a
// differently-proportioned source image, which Google then pads with
// black bars rather than cropping itself).
export const PLATFORM_VARIANT: Record<SocialAdapter['platform'], string> = {
  FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin',
  GOOGLE_BUSINESS: 'google-business',
  INSTAGRAM: 'instagram-square',
};

// Called once a NewsPost is actually published on the site — "push not
// pull, site first" (Stage D's explicit direction). Multi-office: a
// post's Publishing Target (publishToOfficeIds — empty means "All
// Offices") decides which offices' connected accounts are candidates at
// all; for each of those offices, each platform's own participation
// (PublishingDestination, per office) and connection status
// (isConfigured, per office) decide Auto vs Manual independently. Never
// attempts a live API call without credentials, never fabricates a
// "posted" result — see D5.
export async function queueSocialPostsForNewsPost(newsPostId: string): Promise<void> {
  const post = await prisma.newsPost.findUnique({ where: { id: newsPostId } });
  if (!post) return;

  const targetOffices =
    post.publishToOfficeIds.length > 0
      ? await prisma.office.findMany({ where: { id: { in: post.publishToOfficeIds }, status: 'ACTIVE' } })
      : await prisma.office.findMany({ where: { status: 'ACTIVE' } });
  if (targetOffices.length === 0) return;

  // Resolved once per dispatch, reused by every office/platform — a
  // post's featured image is only ever a candidate for an outbound
  // social image if the public route will actually serve it (same
  // isPubliclyVisible check the route itself uses).
  const siteUrl = await getSiteUrl();
  let imageUrl: string | undefined;
  let imageVariants = new Set<string>();
  if (post.featuredImageId && (await isPubliclyVisible(post.featuredImageId))) {
    imageUrl = `${siteUrl}/api/media/${post.featuredImageId}`;
    const variants = await prisma.mediaAssetVariant.findMany({
      where: { assetId: post.featuredImageId, purpose: { in: Object.values(PLATFORM_VARIANT) } },
      select: { purpose: true },
    });
    imageVariants = new Set(variants.map((v) => v.purpose));
  }

  // Data-driven participation: a PublishingDestination row with
  // isEnabled=false means "skip this office+platform combination
  // entirely," admin-editable from /admin/publishing. No row yet for a
  // given (office, platform) pair defaults to enabled, so a newly
  // created office starts fully participating rather than silently
  // opted out.
  const destinations = await prisma.publishingDestination.findMany({ where: { officeId: { in: targetOffices.map((o) => o.id) } } });
  const disabled = new Set(destinations.filter((d) => !d.isEnabled).map((d) => `${d.officeId}:${d.platform}`));

  // Per-article platform selection — empty means every platform (same
  // "empty means all" convention as publishToOfficeIds above), so posts
  // saved before this field existed keep dispatching exactly as before.
  const selectedPlatforms = post.publishPlatforms.length > 0 ? new Set(post.publishPlatforms) : null;

  for (const office of targetOffices) {
    for (const adapter of socialAdapters) {
      if (disabled.has(`${office.id}:${adapter.platform}`)) continue;
      if (selectedPlatforms && !selectedPlatforms.has(adapter.platform)) continue;

      const variantPurpose = PLATFORM_VARIANT[adapter.platform];
      const platformImageUrl =
        imageUrl && imageVariants.has(variantPurpose) ? `${siteUrl}/api/media/${post.featuredImageId}?variant=${variantPurpose}` : imageUrl;
      const content = adapter.formatContent({
        title: post.title,
        excerpt: post.excerpt,
        canonicalUrl: `${siteUrl}/insights/news/${post.slug}`,
        imageUrl: platformImageUrl,
      });
      const configured = await adapter.isConfigured(office.id);

      const existing = await prisma.socialPost.findUnique({
        where: { newsPostId_platform_officeId: { newsPostId, platform: adapter.platform, officeId: office.id } },
      });

      if (!configured) {
        // Manual mode: generate/refresh the package, never touch a
        // status that already reflects a real attempt.
        if (existing) {
          await prisma.socialPost.update({
            where: { id: existing.id },
            data: { mode: 'MANUAL', status: 'MANUAL', caption: content.caption },
          });
        } else {
          await prisma.socialPost.create({
            data: { newsPostId, platform: adapter.platform, officeId: office.id, mode: 'MANUAL', status: 'MANUAL', caption: content.caption, campaignId: post.campaignId },
          });
        }
        continue;
      }

      // Auto mode — not reachable in this environment (isConfigured()
      // requires a real credential connected from Settings →
      // Integrations for this specific office, which never exists
      // here), but written for real so connecting an office's account
      // later is a config change only.
      const record = existing
        ? await prisma.socialPost.update({
            where: { id: existing.id },
            data: { mode: 'AUTO', caption: content.caption, attemptCount: { increment: 1 } },
          })
        : await prisma.socialPost.create({
            data: { newsPostId, platform: adapter.platform, officeId: office.id, mode: 'AUTO', status: 'PENDING', caption: content.caption, attemptCount: 1, campaignId: post.campaignId },
          });

      try {
        const result = await adapter.publish(content, office.id);
        await prisma.socialPost.update({
          where: { id: record.id },
          data: { status: 'POSTED', permalink: result.permalink, postedAt: new Date(), errorMessage: null },
        });
        await recordIntegrationPublish(adapter.platform, office.id, { ok: true });
      } catch (error) {
        // A social failure must never block or roll back the website
        // publish that already happened — this only updates the
        // SocialPost row's own status for the admin to see and retry.
        const message = error instanceof Error ? error.message : 'Unknown error.';
        await prisma.socialPost.update({
          where: { id: record.id },
          data: { status: 'FAILED', errorMessage: message },
        });
        await recordIntegrationPublish(adapter.platform, office.id, { ok: false, error: message });
      }
    }
  }
}

// Portfolio-project equivalent of queueSocialPostsForNewsPost above —
// same office/platform targeting and Auto/Manual/retry mechanics, but
// NOT wired to the project's own website-publish action. A project
// going live on /projects and a project being announced on social are
// deliberately separate decisions here (unlike NewsPost, where
// publishing the article is itself the trigger) — an admin clicks
// "Publish to Social" explicitly, which may happen well after (or
// before) the case-study page itself goes live.
export async function queueSocialPostsForPortfolioProject(projectId: string): Promise<void> {
  const project = await prisma.portfolioProject.findUnique({ where: { id: projectId } });
  if (!project) return;

  const targetOffices =
    project.publishToOfficeIds.length > 0
      ? await prisma.office.findMany({ where: { id: { in: project.publishToOfficeIds }, status: 'ACTIVE' } })
      : await prisma.office.findMany({ where: { status: 'ACTIVE' } });
  if (targetOffices.length === 0) return;

  const siteUrl = await getSiteUrl();
  let imageUrl: string | undefined;
  let imageVariants = new Set<string>();
  if (project.heroImageId && (await isPubliclyVisible(project.heroImageId))) {
    imageUrl = `${siteUrl}/api/media/${project.heroImageId}`;
    const variants = await prisma.mediaAssetVariant.findMany({
      where: { assetId: project.heroImageId, purpose: { in: Object.values(PLATFORM_VARIANT) } },
      select: { purpose: true },
    });
    imageVariants = new Set(variants.map((v) => v.purpose));
  }

  const destinations = await prisma.publishingDestination.findMany({ where: { officeId: { in: targetOffices.map((o) => o.id) } } });
  const disabled = new Set(destinations.filter((d) => !d.isEnabled).map((d) => `${d.officeId}:${d.platform}`));

  const selectedPlatforms = project.publishPlatforms.length > 0 ? new Set(project.publishPlatforms) : null;

  // Same fallback chain the DB-cutover's toLegacyProject() mapper uses
  // for the public page's own SEO description — a project may have
  // either field empty, never both by convention (the migrated data
  // always has resultStatement; briefDefinitionalSentence covers a
  // freshly created draft that hasn't filled it in yet).
  const excerpt = project.resultStatement || project.briefDefinitionalSentence || '';

  for (const office of targetOffices) {
    for (const adapter of socialAdapters) {
      if (disabled.has(`${office.id}:${adapter.platform}`)) continue;
      if (selectedPlatforms && !selectedPlatforms.has(adapter.platform)) continue;

      const variantPurpose = PLATFORM_VARIANT[adapter.platform];
      const platformImageUrl =
        imageUrl && imageVariants.has(variantPurpose) ? `${siteUrl}/api/media/${project.heroImageId}?variant=${variantPurpose}` : imageUrl;
      const content = adapter.formatContent({
        title: project.title,
        excerpt,
        canonicalUrl: `${siteUrl}/projects/${project.slug}`,
        imageUrl: platformImageUrl,
      });
      const configured = await adapter.isConfigured(office.id);

      const existing = await prisma.socialPost.findUnique({
        where: { portfolioProjectId_platform_officeId: { portfolioProjectId: projectId, platform: adapter.platform, officeId: office.id } },
      });

      if (!configured) {
        if (existing) {
          await prisma.socialPost.update({
            where: { id: existing.id },
            data: { mode: 'MANUAL', status: 'MANUAL', caption: content.caption },
          });
        } else {
          await prisma.socialPost.create({
            data: { portfolioProjectId: projectId, platform: adapter.platform, officeId: office.id, mode: 'MANUAL', status: 'MANUAL', caption: content.caption },
          });
        }
        continue;
      }

      const record = existing
        ? await prisma.socialPost.update({
            where: { id: existing.id },
            data: { mode: 'AUTO', caption: content.caption, attemptCount: { increment: 1 } },
          })
        : await prisma.socialPost.create({
            data: { portfolioProjectId: projectId, platform: adapter.platform, officeId: office.id, mode: 'AUTO', status: 'PENDING', caption: content.caption, attemptCount: 1 },
          });

      try {
        const result = await adapter.publish(content, office.id);
        await prisma.socialPost.update({
          where: { id: record.id },
          data: { status: 'POSTED', permalink: result.permalink, postedAt: new Date(), errorMessage: null },
        });
        await recordIntegrationPublish(adapter.platform, office.id, { ok: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error.';
        await prisma.socialPost.update({
          where: { id: record.id },
          data: { status: 'FAILED', errorMessage: message },
        });
        await recordIntegrationPublish(adapter.platform, office.id, { ok: false, error: message });
      }
    }
  }
}
