// Seeds the ~10 official AHW templates as data (SocialTemplate.definition
// JSON), not code — this script is the one place that knows what "the
// official set" is; the render engine (lib/content-studio/template-engine)
// has no knowledge of any specific template. Safe to re-run (upserts by
// key). Not part of the app runtime — a one-off setup script, same
// category as prisma/seed.ts and scripts/seed-c3-fixtures.ts.
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Shared building blocks so 10 templates don't mean 10 unrelated,
// inconsistent layouts — every official template still reads as one
// family, the way real brand template sets do.
const backgroundImage = { type: 'image', source: 'sourceAsset', fit: 'cover' } as const;
const bottomScrim = { type: 'gradient-overlay', direction: 'to-top', colorToken: 'ink', maxOpacity: 0.85 } as const;
const websiteFooter = {
  type: 'text',
  variable: 'websiteUrl',
  fallback: 'ahwspaces.com',
  position: { xPct: 0.06, yPct: 0.95 },
  anchorX: 'left',
  anchorY: 'bottom',
  fontToken: 'primary',
  weightToken: 'regular',
  sizeToken: 'body',
  colorToken: 'stone',
  maxWidthPct: 0.5,
  uppercase: true,
  letterSpacing: 1,
} as const;
const logoTopRight = {
  type: 'logo',
  slot: 'light',
  position: { xPct: 0.94, yPct: 0.06 },
  anchorX: 'right',
  anchorY: 'top',
  widthPct: 0.16,
} as const;
const watermark = { type: 'watermark' } as const;

function eyebrowBadge(variable: string, fallback: string) {
  return {
    type: 'badge' as const,
    variable,
    fallback,
    position: { xPct: 0.06, yPct: 0.06 },
    anchorX: 'left' as const,
    anchorY: 'top' as const,
    backgroundToken: 'paper' as const,
    colorToken: 'ink' as const,
  };
}

function headline(variable: string, fallback: string, yPct = 0.82) {
  return {
    type: 'text' as const,
    variable,
    fallback,
    position: { xPct: 0.06, yPct },
    anchorX: 'left' as const,
    anchorY: 'bottom' as const,
    fontToken: 'secondary' as const,
    weightToken: 'light' as const,
    sizeToken: 'display' as const,
    colorToken: 'paper' as const,
    maxWidthPct: 0.88,
  };
}

function subheadline(variable: string, fallback: string, yPct = 0.89) {
  return {
    type: 'text' as const,
    variable,
    fallback,
    position: { xPct: 0.06, yPct },
    anchorX: 'left' as const,
    anchorY: 'bottom' as const,
    fontToken: 'primary' as const,
    weightToken: 'regular' as const,
    sizeToken: 'body' as const,
    colorToken: 'stone' as const,
    maxWidthPct: 0.7,
  };
}

const templates = [
  {
    key: 'luxury-architecture',
    name: 'Luxury Architecture',
    category: 'Architecture',
    description: 'Full-bleed hero photography with an oversized project name — the site\'s own editorial voice.',
    variables: ['eyebrow', 'projectName', 'serviceName', 'websiteUrl'],
    layers: [backgroundImage, bottomScrim, logoTopRight, eyebrowBadge('eyebrow', 'AHW Architects'), headline('projectName', 'Project Name'), subheadline('serviceName', 'Architecture'), websiteFooter, watermark],
  },
  {
    key: 'interior-design',
    name: 'Interior Design',
    category: 'Interiors',
    description: 'Same editorial frame, tuned for interior photography with a room/space label.',
    variables: ['eyebrow', 'spaceName', 'projectName', 'websiteUrl'],
    layers: [backgroundImage, bottomScrim, logoTopRight, eyebrowBadge('eyebrow', 'Interior Design'), headline('spaceName', 'Space Name'), subheadline('projectName', 'Project Name'), websiteFooter, watermark],
  },
  {
    key: 'construction-progress',
    name: 'Construction Progress',
    category: 'Projects',
    description: 'Progress-photo focused — phase badge and a percent-complete line.',
    variables: ['phase', 'projectName', 'progressLabel', 'websiteUrl'],
    layers: [backgroundImage, bottomScrim, logoTopRight, eyebrowBadge('phase', 'Under Construction'), headline('projectName', 'Project Name'), subheadline('progressLabel', 'Progress Update'), websiteFooter, watermark],
  },
  {
    key: 'before-after',
    name: 'Before & After',
    category: 'Projects',
    description: 'Single-image transformation post — the caption carries the before/after story.',
    variables: ['eyebrow', 'projectName', 'transformationNote', 'websiteUrl'],
    layers: [backgroundImage, bottomScrim, logoTopRight, eyebrowBadge('eyebrow', 'Before & After'), headline('projectName', 'Project Name'), subheadline('transformationNote', 'Complete transformation'), websiteFooter, watermark],
  },
  {
    key: 'project-milestone',
    name: 'Project Milestone',
    category: 'Projects',
    description: 'Celebrates a specific milestone (topping out, handover, groundbreaking).',
    variables: ['milestoneName', 'projectName', 'websiteUrl'],
    layers: [backgroundImage, bottomScrim, logoTopRight, eyebrowBadge('milestoneName', 'Milestone'), headline('projectName', 'Project Name'), websiteFooter, watermark],
  },
  {
    key: 'client-testimonial',
    name: 'Client Testimonial',
    category: 'Brand',
    description: 'Quote-forward layout — the headline slot carries the testimonial text itself.',
    variables: ['clientName', 'quote', 'websiteUrl'],
    layers: [
      backgroundImage,
      { type: 'solid-overlay', colorToken: 'ink', opacity: 0.55 },
      logoTopRight,
      headline('quote', '"Exceptional design, delivered with precision."', 0.75),
      subheadline('clientName', 'Client Name', 0.87),
      websiteFooter,
      watermark,
    ],
  },
  {
    key: 'company-announcement',
    name: 'Company Announcement',
    category: 'Brand',
    description: 'General-purpose announcement layout — new office, award, team news.',
    variables: ['eyebrow', 'headline', 'websiteUrl'],
    layers: [backgroundImage, { type: 'solid-overlay', colorToken: 'ink', opacity: 0.45 }, logoTopRight, eyebrowBadge('eyebrow', 'Announcement'), headline('headline', 'Announcement Headline', 0.8), websiteFooter, watermark],
  },
  {
    key: 'case-study',
    name: 'Case Study',
    category: 'Editorial',
    description: 'Publication-style frame for a deep-dive article — eyebrow reads "Case Study."',
    variables: ['projectName', 'summary', 'websiteUrl'],
    layers: [backgroundImage, bottomScrim, logoTopRight, eyebrowBadge('eyebrow', 'Case Study'), headline('projectName', 'Project Name'), subheadline('summary', 'A closer look'), websiteFooter, watermark],
  },
  {
    key: 'design-insight',
    name: 'Design Insight',
    category: 'Editorial',
    description: 'Thought-leadership post — headline carries the insight, not a project name.',
    variables: ['insightTitle', 'websiteUrl'],
    layers: [backgroundImage, bottomScrim, logoTopRight, eyebrowBadge('eyebrow', 'Design Insight'), headline('insightTitle', 'Insight Title'), websiteFooter, watermark],
  },
  {
    key: 'minimal-editorial',
    name: 'Minimal Editorial',
    category: 'Editorial',
    description: 'The quietest template — no badge, no scrim, just the photo, a small logo, and one line of type.',
    variables: ['caption', 'websiteUrl'],
    layers: [
      backgroundImage,
      { type: 'logo', slot: 'light', position: { xPct: 0.06, yPct: 0.06 }, anchorX: 'left', anchorY: 'top', widthPct: 0.14 },
      {
        type: 'text',
        variable: 'caption',
        fallback: 'AHW Architects',
        position: { xPct: 0.06, yPct: 0.94 },
        anchorX: 'left',
        anchorY: 'bottom',
        fontToken: 'primary',
        weightToken: 'regular',
        sizeToken: 'body',
        colorToken: 'paper',
        maxWidthPct: 0.85,
      },
    ],
  },
] as const;

async function main() {
  for (const t of templates) {
    await prisma.socialTemplate.upsert({
      where: { key: t.key },
      update: { name: t.name, category: t.category, description: t.description, definition: { variables: t.variables, layers: t.layers } as never, isOfficial: true },
      create: {
        key: t.key,
        name: t.name,
        category: t.category,
        description: t.description,
        definition: { variables: t.variables, layers: t.layers } as never,
        isOfficial: true,
        isActive: true,
      },
    });
    console.log(`seeded: ${t.key}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
