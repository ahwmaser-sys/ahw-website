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
// NOTE: this can only be run somewhere DATABASE_URL is actually
// available. Vercel's Postgres integration marks it (and
// DATABASE_URL_UNPOOLED) as a sensitive env var, so `vercel env pull`
// returns them empty — this script cannot reach production from a
// local shell. The real one-time production import instead runs via
// the "Import from legacy data" action on the empty /admin/portfolio
// list page (lib/portal/actions/portfolio.ts's
// importLegacyPortfolioProjects), which shares this exact mapping
// logic (lib/portal/portfolio-legacy-import.ts) but runs inside the
// deployed app, where DATABASE_URL is available at runtime. This
// script remains useful for local verification against a dev database.
//
// Usage:
//   npx tsx apps/public-site/scripts/migrate-portfolio-projects.ts --dry-run
//   npx tsx apps/public-site/scripts/migrate-portfolio-projects.ts
// Run from the repo root with DATABASE_URL set in the environment.

import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { projects, buildSortOrders, buildCreateData, buildGalleryImages, buildFaqItems, validateEnums } from '../src/lib/portal/portfolio-legacy-import';

const { PrismaClient } = pkg;

const dryRun = process.argv.includes('--dry-run');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Migrating ${projects.length} projects from the static data file${dryRun ? ' (--dry-run, no writes)' : ''}...`);

  const failures = projects.map(validateEnums).filter((f): f is string => f !== null);
  if (failures.length > 0) {
    console.error(`${failures.length} project(s) failed enum validation:`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  const { order: sortOrders, missing } = buildSortOrders(projects);
  if (missing.length > 0) {
    console.warn(`WARNING: ${missing.length} project(s) missing from PROJECT_DISPLAY_ORDER, appending at the end:`);
    for (const p of missing) console.warn(`  - ${p.slug}`);
  }

  let created = 0;
  let skipped = 0;

  for (const project of projects) {
    const existing = await prisma.portfolioProject.findUnique({ where: { slug: project.slug }, select: { id: true } });
    if (existing) {
      console.log(`SKIP  ${project.slug} — already migrated`);
      skipped += 1;
      continue;
    }

    const sortOrder = sortOrders.get(project.slug) ?? 0;
    console.log(`${dryRun ? 'DRY-RUN' : 'CREATE'} ${project.slug} — sortOrder=${sortOrder}, gallery=${buildGalleryImages(project).length}, faq=${buildFaqItems(project).length}`);

    if (!dryRun) {
      const data: Prisma.PortfolioProjectCreateInput = buildCreateData(project, sortOrder);
      await prisma.portfolioProject.create({ data });
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
