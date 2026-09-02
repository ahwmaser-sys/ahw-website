// One-off migration: ports the public Projects portfolio off the
// hardcoded static array (packages/ui-components/src/data/projects.ts)
// into the DB-backed PortfolioProject/PortfolioProjectImage/
// PortfolioProjectFaqItem tables. Not part of the app runtime — same
// category as prisma/seed.ts and scripts/seed-official-templates.ts.
//
// Idempotent by design, but only in the "never overwrite" direction: if
// a PortfolioProject with a given slug already exists, this script
// skips it and moves on — it never re-migrates or overwrites a row,
// which protects any admin edits made after an earlier run. Re-running
// this script is always safe; it can only ever add rows for slugs it
// hasn't seen before.
//
// Every legacy image (hero/hubFlagship/hubPair/og, and every design/
// build/result gallery image) is stored as a plain externalUrl pointing
// at its existing /ahw-projects-assets/... path — nothing is copied or
// re-uploaded. Only new images an admin attaches going forward go
// through the real Media Library pipeline.
//
// Usage:
//   npx tsx apps/public-site/scripts/migrate-portfolio-projects.ts --dry-run
//   npx tsx apps/public-site/scripts/migrate-portfolio-projects.ts
// Run from the repo root with DATABASE_URL set in the environment.

import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
import { projects } from '../../../packages/ui-components/src/data/projects';
import { PROJECT_DISPLAY_ORDER } from '../../../packages/ui-components/src/data/projectOrder';
import type { Project } from '../../../packages/ui-components/src/data/projects';

const { PrismaClient } = pkg;

const dryRun = process.argv.includes('--dry-run');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

function mapEnum(map: Record<string, string>, value: string, field: string, slug: string): string {
  const mapped = map[value];
  if (!mapped) {
    throw new Error(`${slug}: unrecognized ${field} value "${value}" — not in the expected set (${Object.keys(map).join(', ')})`);
  }
  return mapped;
}

// Any slug in projects.ts but missing from PROJECT_DISPLAY_ORDER sorts
// after every explicitly-ordered project, alphabetically by title among
// itself — visible and reachable, never silently dropped, but never
// jumping ahead of the deliberate order by accident either. This
// mirrors sortByDisplayOrder()'s own fallback in projectOrder.ts.
function buildSortOrders(allProjects: Project[]): Map<string, number> {
  const missing = allProjects
    .filter((p) => !PROJECT_DISPLAY_ORDER.includes(p.slug))
    .sort((a, b) => a.title.localeCompare(b.title));

  if (missing.length > 0) {
    console.warn(`WARNING: ${missing.length} project(s) missing from PROJECT_DISPLAY_ORDER, appending at the end:`);
    for (const p of missing) console.warn(`  - ${p.slug}`);
  }

  const order = new Map<string, number>();
  PROJECT_DISPLAY_ORDER.forEach((slug, i) => order.set(slug, i));
  missing.forEach((p, i) => order.set(p.slug, PROJECT_DISPLAY_ORDER.length + i));
  return order;
}

interface GalleryImageInput {
  section: 'DESIGN' | 'BUILD' | 'RESULT';
  externalUrl: string;
  sortOrder: number;
}

function buildGalleryImages(project: Project): GalleryImageInput[] {
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

interface FaqItemInput {
  question: string;
  answer: string;
  sortOrder: number;
}

function buildFaqItems(project: Project): FaqItemInput[] {
  return (project.caseStudy?.narrative?.faq ?? []).map((item, i) => ({
    question: item.question,
    answer: item.answer,
    sortOrder: i,
  }));
}

async function main() {
  console.log(`Migrating ${projects.length} projects from the static data file${dryRun ? ' (--dry-run, no writes)' : ''}...`);

  // Validate every enum mapping up front — collect every failure
  // instead of stopping at the first one, so a --dry-run run tells you
  // everything that needs fixing in one pass.
  const failures: string[] = [];
  for (const project of projects) {
    try {
      mapEnum(SECTOR_MAP, project.sector, 'sector', project.slug);
      mapEnum(MARKET_MAP, project.market, 'market', project.slug);
      mapEnum(TIER_MAP, project.tier, 'tier', project.slug);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (failures.length > 0) {
    console.error(`${failures.length} project(s) failed enum validation:`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  const sortOrders = buildSortOrders(projects);

  let created = 0;
  let skipped = 0;

  for (const project of projects) {
    const existing = await prisma.portfolioProject.findUnique({ where: { slug: project.slug }, select: { id: true } });
    if (existing) {
      console.log(`SKIP  ${project.slug} — already migrated`);
      skipped += 1;
      continue;
    }

    const cs = project.caseStudy;
    const narrative = cs?.narrative;
    const seo = narrative?.seo;
    const galleryImages = buildGalleryImages(project);
    const faqItems = buildFaqItems(project);

    console.log(`${dryRun ? 'DRY-RUN' : 'CREATE'} ${project.slug} — sortOrder=${sortOrders.get(project.slug)}, gallery=${galleryImages.length}, faq=${faqItems.length}`);

    if (!dryRun) {
      await prisma.portfolioProject.create({
        data: {
          slug: project.slug,
          title: project.title,
          sector: mapEnum(SECTOR_MAP, project.sector, 'sector', project.slug) as never,
          city: project.city,
          market: mapEnum(MARKET_MAP, project.market, 'market', project.slug) as never,
          area: project.area,
          year: project.year,
          tier: mapEnum(TIER_MAP, project.tier, 'tier', project.slug) as never,
          services: project.services ?? [],
          client: project.client ?? null,
          stage: project.status ?? null,
          status: 'PUBLISHED', // every project in the static file is already live today
          sortOrder: sortOrders.get(project.slug) ?? PROJECT_DISPLAY_ORDER.length,
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

          galleryImages: { create: galleryImages },
          faqItems: { create: faqItems },
        },
      });
    }
    created += 1;
  }

  console.log(`\nDone. ${created} ${dryRun ? 'would be created' : 'created'}, ${skipped} skipped (already migrated).`);
  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  process.exitCode = 1;
  await prisma.$disconnect();
});
