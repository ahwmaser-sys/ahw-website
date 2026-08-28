import { newsItems as staticNewsItems, type NewsItem } from '@agp/ui-components';
import { prisma } from './db';

// Bridges the new admin-authored NewsPost table into the existing
// public /insights/news pages. staticNewsItems (packages/ui-components)
// is currently an empty array reserved for hand-written entries — this
// merges it with anything published from the admin panel rather than
// replacing it, so nothing about the existing (currently empty) news
// system changes shape, and adding a real static entry later still
// works exactly as before.
// Smart-cropped, pre-sized 1920x1080 JPEG the upload pipeline already
// generates for every IMAGE-kind asset (see media/output-targets.ts) —
// using it here instead of the raw original avoids serving a multi-MB
// source file as a page banner. Falls back to the raw asset for the rare
// image uploaded before variant generation existed.
const COVER_VARIANT = 'website-hero';

export async function getPublicNewsItems(): Promise<NewsItem[]> {
  const posts = await prisma.newsPost.findMany({
    where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: 'desc' },
  });

  const featuredImageIds = posts.map((p) => p.featuredImageId).filter((id): id is string => Boolean(id));
  const heroVariants = featuredImageIds.length
    ? await prisma.mediaAssetVariant.findMany({
        where: { assetId: { in: featuredImageIds }, purpose: COVER_VARIANT },
        select: { assetId: true },
      })
    : [];
  const hasHeroVariant = new Set(heroVariants.map((v) => v.assetId));

  const dbItems: NewsItem[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    content: post.body,
    date: (post.publishedAt ?? post.createdAt).toISOString(),
    slug: post.slug,
    // /api/media/[assetId] is the public-facing route built specifically
    // for this — it re-checks isPubliclyVisible() on every request rather
    // than trusting URL obscurity, so a stable path here stays safe even
    // if the post is later unpublished.
    ...(post.featuredImageId
      ? {
          coverImage: hasHeroVariant.has(post.featuredImageId)
            ? `/api/media/${post.featuredImageId}?variant=${COVER_VARIANT}`
            : `/api/media/${post.featuredImageId}`,
        }
      : {}),
  }));

  return [...dbItems, ...staticNewsItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
