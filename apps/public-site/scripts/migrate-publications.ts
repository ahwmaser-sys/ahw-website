// One-off migration: ports the public Publications ("As Seen In" press
// mentions) off the hardcoded static array
// (packages/ui-components/src/data/publications.ts) into the DB-backed
// Publication table. Not part of the app runtime — same category as
// prisma/seed.ts and scripts/migrate-portfolio-projects.ts.
//
// Idempotent by design, but only in the "never overwrite" direction: if
// a Publication with a given slug already exists, this script skips it
// and moves on. Re-running this script is always safe.
//
// NOTE: this can only be run somewhere DATABASE_URL is actually
// available — Vercel marks it sensitive, so `vercel env pull` returns
// it empty. The real one-time production import instead runs via the
// "Import from legacy data" action on the empty /admin/publications
// list page (lib/portal/actions/publications.ts's
// importLegacyPublications), which shares this exact mapping logic
// (lib/portal/publication-legacy-import.ts) but runs inside the
// deployed app. This script remains useful for local verification.
//
// Usage:
//   npx tsx apps/public-site/scripts/migrate-publications.ts --dry-run
//   npx tsx apps/public-site/scripts/migrate-publications.ts
// Run from the repo root with DATABASE_URL set in the environment.

import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { publications, buildCreateData } from '../src/lib/portal/publication-legacy-import';

const { PrismaClient } = pkg;

const dryRun = process.argv.includes('--dry-run');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Migrating ${publications.length} publications from the static data file${dryRun ? ' (--dry-run, no writes)' : ''}...`);

  let created = 0;
  let skipped = 0;

  for (const pub of publications) {
    const existing = await prisma.publication.findUnique({ where: { slug: pub.slug }, select: { id: true } });
    if (existing) {
      console.log(`SKIP  ${pub.slug} — already migrated`);
      skipped += 1;
      continue;
    }

    console.log(`${dryRun ? 'DRY-RUN' : 'CREATE'} ${pub.slug} — outlet=${pub.outlet}, tags=${(pub.tags ?? []).length}`);

    if (!dryRun) {
      const data: Prisma.PublicationCreateInput = buildCreateData(pub);
      await prisma.publication.create({ data });
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
