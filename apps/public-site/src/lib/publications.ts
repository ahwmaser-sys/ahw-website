import { cache } from 'react';
import { prisma } from './portal/db';
import type { Publication } from '@agp/ui-components';

// The DB-backed replacement for packages/ui-components/src/data/
// publications.ts's static `publications` array — every public
// consumer that used to import that array now calls one of these
// instead. Reconstructs the exact same `Publication` shape the static
// file produced, so render-layer code needed zero changes — only the
// data-fetching top of each page changed. Same pattern as lib/portfolio.ts.

function resolveImageUrl(assetId: string | null, url: string | null): string | undefined {
  if (assetId) return `/api/media/${assetId}`;
  return url ?? undefined;
}

function toLegacyPublication(p: {
  id: string;
  slug: string;
  outlet: string;
  title: string;
  excerpt: string;
  content: string | null;
  date: Date;
  url: string;
  coverImageId: string | null;
  coverImageUrl: string | null;
  coverImageCaption: string | null;
  relatedProjectSlugs: string[];
  tags: string[];
  isFeatured: boolean;
  readingTime: string | null;
}): Publication {
  const coverImage = resolveImageUrl(p.coverImageId, p.coverImageUrl);
  return {
    id: p.id,
    slug: p.slug,
    outlet: p.outlet,
    title: p.title,
    excerpt: p.excerpt,
    ...(p.content ? { content: p.content } : {}),
    date: p.date.toISOString(),
    url: p.url,
    ...(coverImage ? { coverImage } : {}),
    ...(p.coverImageCaption ? { coverImageCaption: p.coverImageCaption } : {}),
    ...(p.relatedProjectSlugs.length > 0 ? { relatedProjectSlugs: p.relatedProjectSlugs } : {}),
    ...(p.tags.length > 0 ? { tags: p.tags } : {}),
    ...(p.isFeatured ? { isFeatured: p.isFeatured } : {}),
    ...(p.readingTime ? { readingTime: p.readingTime } : {}),
  };
}

// Cached per request — several consumers (the listing page, the detail
// page's related lookups, sitemap.ts, the RSS feed) can all call this
// on the same render without issuing repeat queries.
export const getPublicPublications = cache(async (): Promise<Publication[]> => {
  const rows = await prisma.publication.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { date: 'desc' },
  });
  return rows.map(toLegacyPublication);
});

export async function getPublicPublicationBySlug(slug: string): Promise<Publication | null> {
  const row = await prisma.publication.findFirst({ where: { slug, status: 'PUBLISHED' } });
  return row ? toLegacyPublication(row) : null;
}
