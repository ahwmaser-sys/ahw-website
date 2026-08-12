// One-off LOCAL fixture script for testing the Client Reviews feature
// (Mode B — Google API not configured/authenticated locally). Inserts a
// handful of clearly-marked sample reviews for the Egypt office so the
// Admin and Homepage can be exercised end-to-end without a real Google
// sync. Every row has isSampleData: true — the Admin table flags this
// visibly, and this data must never be mistaken for real Google reviews.
// NOT part of the app runtime, not referenced by any production code
// path. Safe to re-run (upserts by a fixed externalId per sample row).
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SAMPLE_REVIEWS = [
  {
    externalId: 'sample-review-1',
    reviewerName: 'Mostafa El-Sayed',
    rating: 5,
    reviewText:
      'AHW guided us from a raw plot of land to a finished home that felt considered in every room. What stood out was how disciplined the structural coordination was — no surprises on site, no change orders we hadn\'t already been walked through. The team delivered exactly what was on the drawings.',
    reviewDate: new Date('2026-05-14'),
    featured: true,
    published: true,
    displayOrder: 0,
  },
  {
    externalId: 'sample-review-2',
    reviewerName: 'Rana Farouk',
    rating: 5,
    reviewText:
      'We renovated our retail space with AHW while staying fully open to customers. Their phased approach meant we never lost a single day of trading, and the finished fit-out is exactly the premium feel we asked for.',
    reviewDate: new Date('2026-04-02'),
    featured: true,
    published: true,
    displayOrder: 1,
  },
  {
    externalId: 'sample-review-3',
    reviewerName: 'Karim Abdel Hafez',
    rating: 4,
    reviewText:
      'Solid project management from concept through handover. Communication could have been slightly faster at the permitting stage, but the design and construction quality were excellent throughout.',
    reviewDate: new Date('2026-02-20'),
    featured: false,
    published: true,
    displayOrder: 2,
  },
  {
    externalId: 'sample-review-4',
    reviewerName: 'Nour Hassan',
    rating: 5,
    reviewText: 'Exceptional attention to detail on our interior fit-out. Highly recommend for anyone in New Cairo looking for a design-build partner.',
    reviewDate: new Date('2026-01-10'),
    featured: false,
    published: false,
    displayOrder: 3,
  },
] as const;

async function main() {
  const office = await prisma.office.findUnique({ where: { slug: 'egypt' } });
  if (!office) {
    console.error('No office with slug "egypt" found — run the main prisma db seed first (creates the default offices), then re-run this script.');
    process.exit(1);
  }

  for (const sample of SAMPLE_REVIEWS) {
    await prisma.review.upsert({
      where: { source_externalId: { source: 'MANUAL', externalId: sample.externalId } },
      update: {
        reviewerName: sample.reviewerName,
        rating: sample.rating,
        reviewText: sample.reviewText,
        reviewDate: sample.reviewDate,
        featured: sample.featured,
        published: sample.published,
        displayOrder: sample.displayOrder,
      },
      create: {
        source: 'MANUAL',
        externalId: sample.externalId,
        officeId: office.id,
        reviewerName: sample.reviewerName,
        rating: sample.rating,
        reviewText: sample.reviewText,
        reviewDate: sample.reviewDate,
        featured: sample.featured,
        published: sample.published,
        displayOrder: sample.displayOrder,
        isSampleData: true,
      },
    });
  }

  console.log(`Seeded ${SAMPLE_REVIEWS.length} sample reviews for office "${office.displayName}" (${office.id}).`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
