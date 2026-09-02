// Shared, pure mapping logic between the static projects.ts shape and
// a PortfolioProject create payload — used by both the standalone
// scripts/migrate-portfolio-projects.ts (can't reach production's
// DATABASE_URL from a local shell, see that file's own header) and the
// in-app "Import from legacy data" admin action, which can.
// Direct relative imports into the package's TypeScript source, not the
// '@agp/ui-components' package entry — that entry points at a built
// dist/index.js (package.json's "main") that predates projectOrder.ts
// being added to the source barrel, so PROJECT_DISPLAY_ORDER isn't
// actually resolvable through it outside Next's own bundler (which
// transpiles the workspace package fresh). This module needs to work
// both inside the app and from a bare `tsx` script invocation, so it
// reads the real source directly instead of depending on that build
// being up to date.
import { projects, type Project } from '../../../../../packages/ui-components/src/data/projects';
import { PROJECT_DISPLAY_ORDER } from '../../../../../packages/ui-components/src/data/projectOrder';

export { projects };

const SECTOR_MAP: Record<string, string> = {
  Residential: 'RESIDENTIAL',
  Commercial: 'COMMERCIAL',
  Hospitality: 'HOSPITALITY',
  Workplace: 'WORKPLACE',
  Retail: 'RETAIL',
};

const MARKET_MAP: Record<string, string> = {
  Egypt: 'EGYPT',
  Kuwait: 'KUWAIT',
  UAE: 'UAE',
  Lebanon: 'LEBANON',
};

const TIER_MAP: Record<string, string> = {
  Flagship: 'FLAGSHIP',
  Standard: 'STANDARD',
};

export function mapEnum(map: Record<string, string>, value: string, field: string, slug: string): string {
  const mapped = map[value];
  if (!mapped) {
    throw new Error(`${slug}: unrecognized ${field} value "${value}" — not in the expected set (${Object.keys(map).join(', ')})`);
  }
  return mapped;
}

// Any slug in projects.ts but missing from PROJECT_DISPLAY_ORDER sorts
// after every explicitly-ordered project, alphabetically by title among
// itself — mirrors sortByDisplayOrder()'s own fallback in
// projectOrder.ts.
export function buildSortOrders(allProjects: Project[]): { order: Map<string, number>; missing: Project[] } {
  const missing = allProjects
    .filter((p) => !PROJECT_DISPLAY_ORDER.includes(p.slug))
    .sort((a, b) => a.title.localeCompare(b.title));

  const order = new Map<string, number>();
  PROJECT_DISPLAY_ORDER.forEach((slug, i) => order.set(slug, i));
  missing.forEach((p, i) => order.set(p.slug, PROJECT_DISPLAY_ORDER.length + i));
  return { order, missing };
}

export interface GalleryImageInput {
  section: 'DESIGN' | 'BUILD' | 'RESULT';
  externalUrl: string;
  sortOrder: number;
}

export function buildGalleryImages(project: Project): GalleryImageInput[] {
  const images: GalleryImageInput[] = [];
  const sections: { section: GalleryImageInput['section']; urls: string[] | undefined }[] = [
    { section: 'DESIGN', urls: project.caseStudy?.design.images },
    { section: 'BUILD', urls: project.caseStudy?.build.images },
    { section: 'RESULT', urls: project.caseStudy?.result.images },
  ];
  for (const { section, urls } of sections) {
    (urls ?? []).forEach((url, i) => images.push({ section, externalUrl: url, sortOrder: i }));
  }
  return images;
}

export interface FaqItemInput {
  question: string;
  answer: string;
  sortOrder: number;
}

export function buildFaqItems(project: Project): FaqItemInput[] {
  return (project.caseStudy?.narrative?.faq ?? []).map((item, i) => ({
    question: item.question,
    answer: item.answer,
    sortOrder: i,
  }));
}

export function validateEnums(project: Project): string | null {
  try {
    mapEnum(SECTOR_MAP, project.sector, 'sector', project.slug);
    mapEnum(MARKET_MAP, project.market, 'market', project.slug);
    mapEnum(TIER_MAP, project.tier, 'tier', project.slug);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the create-data shape mirrors PortfolioProjectCreateInput exactly but importing the generated Prisma type here would couple this pure-mapping module to the client
export function buildCreateData(project: Project, sortOrder: number): any {
  const cs = project.caseStudy;
  const narrative = cs?.narrative;
  const seo = narrative?.seo;

  return {
    slug: project.slug,
    title: project.title,
    sector: mapEnum(SECTOR_MAP, project.sector, 'sector', project.slug),
    city: project.city,
    market: mapEnum(MARKET_MAP, project.market, 'market', project.slug),
    area: project.area,
    year: project.year,
    tier: mapEnum(TIER_MAP, project.tier, 'tier', project.slug),
    services: project.services ?? [],
    client: project.client ?? null,
    stage: project.status ?? null,
    status: 'PUBLISHED', // every project in the static file is already live today
    sortOrder,
    resultStatement: project.resultStatement ?? null,

    heroImageUrl: project.heroImage ?? null,
    hubFlagshipImageUrl: project.hubFlagshipImage ?? null,
    hubPairImageUrl: project.hubPairImage ?? null,
    ogImageUrl: project.ogImage ?? null,

    briefClientProblem: cs?.brief.clientProblem ?? null,
    briefDefinitionalSentence: cs?.brief.definitionalSentence ?? null,

    designKeyDecision: cs?.design.keyDecision ?? null,
    designCaption: narrative?.imageStory?.design ?? null,

    buildDuration: cs?.build.duration ?? null,
    buildChallengeResolution: cs?.build.challengeResolution ?? null,
    buildFeatures: cs?.build.features ?? [],
    buildCaption: narrative?.imageStory?.build ?? null,

    resultOutcomes: cs?.result.outcomes ?? [],
    resultClientQuoteText: cs?.result.clientQuote?.quote ?? null,
    resultClientQuoteAuthor: cs?.result.clientQuote?.author ?? null,
    resultCaption: narrative?.imageStory?.result ?? null,

    relatedProjectSlugs: cs?.relatedProjects ?? [],
    relatedExpertiseTitle: cs?.relatedExpertise.title ?? null,
    relatedExpertiseHref: cs?.relatedExpertise.href ?? null,

    heroHeadline: narrative?.heroHeadline ?? null,
    heroSubtitle: narrative?.heroSubtitle ?? null,
    story: narrative?.story ?? [],
    designPhilosophy: narrative?.designPhilosophy ?? null,
    whyDifferent: narrative?.whyDifferent ?? null,
    clientExperience: narrative?.clientExperience ?? [],
    ctaHeadline: narrative?.cta.headline ?? null,
    ctaSubtext: narrative?.cta.subtext ?? null,

    seoTitle: seo?.title ?? null,
    seoDescription: seo?.description ?? null,
    seoFocusKeyword: seo?.focusKeyword ?? null,
    seoSecondaryKeywords: seo?.secondaryKeywords ?? [],
    seoOgTitle: seo?.ogTitle ?? null,
    seoOgDescription: seo?.ogDescription ?? null,
    seoTwitterTitle: seo?.twitterTitle ?? null,
    seoTwitterDescription: seo?.twitterDescription ?? null,

    galleryImages: { create: buildGalleryImages(project) },
    faqItems: { create: buildFaqItems(project) },
  };
}
