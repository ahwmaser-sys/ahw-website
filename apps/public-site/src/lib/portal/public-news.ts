import { newsItems as staticNewsItems, type NewsItem } from '@agp/ui-components';
import { prisma } from './db';

// Bridges the new admin-authored NewsPost table into the existing
// public /insights/news pages. staticNewsItems (packages/ui-components)
// is currently an empty array reserved for hand-written entries — this
// merges it with anything published from the admin panel rather than
// replacing it, so nothing about the existing (currently empty) news
// system changes shape, and adding a real static entry later still
// works exactly as before.
// Smart-cropped, pre-sized JPEGs the upload pipeline already generates
// for every IMAGE-kind asset (see media/output-targets.ts), each cut for
// a specific aspect ratio — using the raw original everywhere serves a
// multi-MB source file as a page banner, and using ONE variant for both
// the wide article banner and the narrower list-card slot forces the
// browser to crop an already-cropped image a second time (confirmed
// live: cut off the top of the subject on the 4:3 card because the
// source was the 16:9 hero variant). COVER_VARIANT matches the article
// page's 16:9 banner slot; THUMBNAIL_VARIANT matches NewsCard's 4:3
// slot. Falls back to the raw asset for the rare image uploaded before
// variant generation existed.
const COVER_VARIANT = 'website-hero';
const THUMBNAIL_VARIANT = 'website-thumbnail';

export async function getPublicNewsItems(): Promise<NewsItem[]> {
  const posts = await prisma.newsPost.findMany({
    where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: 'desc' },
  });

  const featuredImageIds = posts.map((p) => p.featuredImageId).filter((id): id is string => Boolean(id));
  const variants = featuredImageIds.length
    ? await prisma.mediaAssetVariant.findMany({
        where: { assetId: { in: featuredImageIds }, purpose: { in: [COVER_VARIANT, THUMBNAIL_VARIANT] } },
        select: { assetId: true, purpose: true },
      })
    : [];
  const hasVariant = new Set(variants.map((v) => `${v.assetId}:${v.purpose}`));

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
          coverImage: hasVariant.has(`${post.featuredImageId}:${COVER_VARIANT}`)
            ? `/api/media/${post.featuredImageId}?variant=${COVER_VARIANT}`
            : `/api/media/${post.featuredImageId}`,
          thumbnailImage: hasVariant.has(`${post.featuredImageId}:${THUMBNAIL_VARIANT}`)
            ? `/api/media/${post.featuredImageId}?variant=${THUMBNAIL_VARIANT}`
            : `/api/media/${post.featuredImageId}`,
        }
      : {}),
  }));

  return [...dbItems, ...staticNewsItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
