import { cache } from 'react';
import { prisma } from './portal/db';
import type { Prisma } from '@prisma/client';
import type { Project } from '@agp/ui-components';

// The DB-backed replacement for packages/ui-components/src/data/
// projects.ts's static `projects` array — every public consumer that
// used to import that array now calls one of these instead. Reconstructs
// the exact same `Project`/`CaseStudyData`/`ProjectNarrative` shape the
// static file produced, so every render-layer component (ImageMoments,
// ProjectFilterBar, the JSON-LD builders, etc.) needed zero changes —
// only the data-fetching top of each page changed.

const SECTOR_LABEL: Record<string, string> = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  HOSPITALITY: 'Hospitality',
  WORKPLACE: 'Workplace',
  RETAIL: 'Retail',
};

const MARKET_LABEL: Record<string, string> = {
  EGYPT: 'Egypt',
  KUWAIT: 'Kuwait',
  UAE: 'UAE',
  LEBANON: 'Lebanon',
};

const TIER_LABEL: Record<string, string> = {
  FLAGSHIP: 'Flagship',
  STANDARD: 'Standard',
};

function resolveImageUrl(assetId: string | null, url: string | null): string | undefined {
  if (assetId) return `/api/media/${assetId}`;
  return url ?? undefined;
}

const PROJECT_WITH_RELATIONS = {
  include: {
    galleryImages: { orderBy: { sortOrder: 'asc' as const } },
    faqItems: { orderBy: { sortOrder: 'asc' as const } },
  },
};

type PortfolioProjectWithRelations = Prisma.PortfolioProjectGetPayload<typeof PROJECT_WITH_RELATIONS>;

// Only PUBLISHED projects ever reach this mapper (every query below
// filters on it), so caseStudy/narrative are always reconstructed in
// full — no "in preparation" placeholder branch to worry about here,
// unlike a brand-new admin draft that's never queried publicly.
function toLegacyProject(p: PortfolioProjectWithRelations): Project {
  const designImages = p.galleryImages.filter((g) => g.section === 'DESIGN').map((g) => resolveImageUrl(g.assetId, g.externalUrl)).filter((u): u is string => Boolean(u));
  const buildImages = p.galleryImages.filter((g) => g.section === 'BUILD').map((g) => resolveImageUrl(g.assetId, g.externalUrl)).filter((u): u is string => Boolean(u));
  const resultImages = p.galleryImages.filter((g) => g.section === 'RESULT').map((g) => resolveImageUrl(g.assetId, g.externalUrl)).filter((u): u is string => Boolean(u));
  const heroImage = resolveImageUrl(p.heroImageId, p.heroImageUrl);
  const hubFlagshipImage = resolveImageUrl(p.hubFlagshipImageId, p.hubFlagshipImageUrl);
  const hubPairImage = resolveImageUrl(p.hubPairImageId, p.hubPairImageUrl);

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    sector: (SECTOR_LABEL[p.sector] ?? p.sector) as Project['sector'],
    city: p.city,
    market: (MARKET_LABEL[p.market] ?? p.market) as Project['market'],
    area: p.area,
    year: p.year,
    tier: (TIER_LABEL[p.tier] ?? p.tier) as Project['tier'],
    services: p.services,
    ...(p.client ? { client: p.client } : {}),
    ...(p.stage ? { status: p.stage } : {}),
    ...(p.resultStatement ? { resultStatement: p.resultStatement } : {}),
    ...(heroImage ? { heroImage } : {}),
    ...(hubFlagshipImage ? { hubFlagshipImage } : {}),
    ...(hubPairImage ? { hubPairImage } : {}),
    ogImage: resolveImageUrl(p.ogImageId, p.ogImageUrl) ?? '',
    caseStudy: {
      brief: {
        clientProblem: p.briefClientProblem ?? '',
        definitionalSentence: p.briefDefinitionalSentence ?? '',
      },
      design: { images: designImages, keyDecision: p.designKeyDecision ?? '' },
      build: {
        images: buildImages,
        duration: p.buildDuration ?? '',
        challengeResolution: p.buildChallengeResolution ?? '',
        features: p.buildFeatures,
      },
      result: {
        images: resultImages,
        outcomes: p.resultOutcomes,
        ...(p.resultClientQuoteText ? { clientQuote: { quote: p.resultClientQuoteText, author: p.resultClientQuoteAuthor ?? '' } } : {}),
      },
      relatedProjects: p.relatedProjectSlugs,
      relatedExpertise: { title: p.relatedExpertiseTitle ?? '', href: p.relatedExpertiseHref ?? '' },
      narrative: {
        heroHeadline: p.heroHeadline ?? '',
        heroSubtitle: p.heroSubtitle ?? '',
        story: p.story,
        designPhilosophy: p.designPhilosophy ?? '',
        whyDifferent: p.whyDifferent ?? '',
        clientExperience: p.clientExperience,
        imageStory: {
          ...(p.designCaption ? { design: p.designCaption } : {}),
          ...(p.buildCaption ? { build: p.buildCaption } : {}),
          ...(p.resultCaption ? { result: p.resultCaption } : {}),
        },
        faq: p.faqItems.map((f) => ({ question: f.question, answer: f.answer })),
        cta: { headline: p.ctaHeadline ?? '', ...(p.ctaSubtext ? { subtext: p.ctaSubtext } : {}) },
        seo: {
          title: p.seoTitle ?? '',
          description: p.seoDescription ?? '',
          focusKeyword: p.seoFocusKeyword ?? '',
          secondaryKeywords: p.seoSecondaryKeywords,
          ogTitle: p.seoOgTitle ?? '',
          ogDescription: p.seoOgDescription ?? '',
          twitterTitle: p.seoTwitterTitle ?? '',
          twitterDescription: p.seoTwitterDescription ?? '',
        },
      },
    },
  };
}

// Cached per request (same reasoning as getActiveBrandKit/getActiveOffices)
// — several consumers on the same render (layout's nav data, the page
// itself, ProjectFilterBar) can all call this without issuing repeat
// queries.
export const getPublicPortfolioProjects = cache(async (): Promise<Project[]> => {
  const rows = await prisma.portfolioProject.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { sortOrder: 'asc' },
    ...PROJECT_WITH_RELATIONS,
  });
  return rows.map(toLegacyProject);
});

export async function getPublicPortfolioProjectBySlug(slug: string): Promise<Project | null> {
  const row = await prisma.portfolioProject.findFirst({
    where: { slug, status: 'PUBLISHED' },
    ...PROJECT_WITH_RELATIONS,
  });
  return row ? toLegacyProject(row) : null;
}

// Lightweight — just the slugs, for validity checks (residential-
// experience.ts's linkedProjectSlug) that don't need the full shape.
export const getPublishedPortfolioSlugs = cache(async (): Promise<Set<string>> => {
  const rows = await prisma.portfolioProject.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true } });
  return new Set(rows.map((r) => r.slug));
});

export interface PortfolioNavData {
  sectorsInUse: string[];
  marketsInUse: string[];
  featuredProjects: { title: string; slug: string }[];
}

// Feeds both the site nav mega-menu (packages/ui-components' Floating
// NavigationPanel, threaded down via layout.tsx since that package has
// no DB access of its own) and ProjectFilterBar — same "derived from
// live data, a sector/market with zero matching projects structurally
// cannot appear" principle those components already documented for the
// old static-array version.
export const getPortfolioNavData = cache(async (): Promise<PortfolioNavData> => {
  const rows = await prisma.portfolioProject.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { sortOrder: 'asc' },
    select: { slug: true, title: true, sector: true, market: true, tier: true },
  });
  const sectorsInUse = Array.from(new Set(rows.map((r) => SECTOR_LABEL[r.sector] ?? r.sector))).sort();
  const marketsInUse = Array.from(new Set(rows.map((r) => MARKET_LABEL[r.market] ?? r.market))).sort();
  const featuredProjects = rows.filter((r) => r.tier === 'FLAGSHIP').map((r) => ({ title: r.title, slug: r.slug }));
  return { sectorsInUse, marketsInUse, featuredProjects };
});

// Admin "Related project" pickers show every project regardless of
// publish status (an editor linking an in-progress draft is a normal
// workflow) — same convention the old static-array picker had, since
// the static data carried no publish-state concept at all.
export async function getPortfolioProjectOptions(): Promise<{ slug: string; title: string }[]> {
  return prisma.portfolioProject.findMany({ select: { slug: true, title: true }, orderBy: { title: 'asc' } });
}
