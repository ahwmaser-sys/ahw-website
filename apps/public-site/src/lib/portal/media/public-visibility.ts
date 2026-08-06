import { prisma } from '../db';

// Shared by the public asset route (/api/media/[assetId]) and social
// dispatch (an Instagram/Facebook/etc. post can only ever link to an
// image the public route will actually serve) — one definition of
// "publicly visible" rather than two that could drift apart. See that
// route's original comment for the full reasoning: this is checked live
// on every call, never inferred from URL obscurity.
export async function isPubliclyVisible(assetId: string): Promise<boolean> {
  const newsPostMatch = await prisma.newsPost.findFirst({
    where: { OR: [{ featuredImageId: assetId }, { ogImageId: assetId }], status: 'PUBLISHED' },
    select: { id: true },
  });
  if (newsPostMatch) return true;

  const galleryMatch = await prisma.newsPostGalleryImage.findFirst({
    where: { assetId, newsPost: { status: 'PUBLISHED' } },
    select: { id: true },
  });
  if (galleryMatch) return true;

  const landingOg = await prisma.landingPage.findFirst({
    where: { ogImageId: assetId, status: 'PUBLISHED' },
    select: { id: true },
  });
  if (landingOg) return true;

  const publishedPages = await prisma.landingPage.findMany({
    where: { status: 'PUBLISHED' },
    select: { blocks: true },
  });
  return publishedPages.some((page) => JSON.stringify(page.blocks).includes(assetId));
}
