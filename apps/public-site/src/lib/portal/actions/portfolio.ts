'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES, SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import { runMediaPipeline } from '../media/pipeline';
import { projects as legacyProjects, buildSortOrders, buildCreateData, validateEnums } from '../portfolio-legacy-import';
import type { ActionState } from '../../../components/portal/ActionForm';
import type { Prisma } from '@prisma/client';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Short, tag-like lists (services, buildFeatures, resultOutcomes,
// seoSecondaryKeywords) — same comma-separated convention as
// NewsPost's own tags field.
function parseCsv(raw: FormDataEntryValue | undefined): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

// Longer, sentence-like lists (story paragraphs, clientExperience
// bullets) — one per line reads far more naturally in a textarea than
// commas would.
function parseLines(raw: FormDataEntryValue | undefined): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw.split('\n').map((s) => s.trim()).filter(Boolean);
}

const revalidatePublic = (slug?: string) => {
  revalidatePath('/projects');
  if (slug) revalidatePath(`/projects/${slug}`);
  revalidatePath('/');
};

const createSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.'),
  sector: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'HOSPITALITY', 'WORKPLACE', 'RETAIL']),
  market: z.enum(['EGYPT', 'KUWAIT', 'UAE', 'LEBANON']),
  tier: z.enum(['FLAGSHIP', 'STANDARD']),
  city: z.string().trim().min(1, 'City is required.'),
});

export async function createPortfolioProject(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = createSchema.safeParse({
    title: formData.get('title'),
    sector: formData.get('sector'),
    market: formData.get('market'),
    tier: formData.get('tier'),
    city: formData.get('city'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const baseSlug = slugify(parsed.data.title);
  if (!baseSlug) {
    return { error: 'Title must contain at least one letter or number.' };
  }
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.portfolioProject.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const project = await prisma.portfolioProject.create({
    data: {
      title: parsed.data.title,
      slug,
      sector: parsed.data.sector,
      market: parsed.data.market,
      tier: parsed.data.tier,
      city: parsed.data.city,
      area: '',
      year: '',
    },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.portfolio_project_created', entityType: 'PortfolioProject', entityId: project.id });

  revalidatePath('/admin/portfolio');
  redirect(`/admin/portfolio/${project.id}`);
}

const metadataSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required.'),
  slug: z.string().trim().min(1, 'Slug is required.'),
  sector: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'HOSPITALITY', 'WORKPLACE', 'RETAIL']),
  market: z.enum(['EGYPT', 'KUWAIT', 'UAE', 'LEBANON']),
  tier: z.enum(['FLAGSHIP', 'STANDARD']),
  city: z.string().trim().min(1, 'City is required.'),
  area: z.string().trim().optional(),
  year: z.string().trim().optional(),
  client: z.string().trim().optional(),
  stage: z.string().trim().optional(),
  services: z.string().optional(),
  resultStatement: z.string().trim().optional(),
});

export async function updatePortfolioProjectMetadata(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = metadataSchema.safeParse({
    projectId: formData.get('projectId'),
    title: formData.get('title'),
    slug: formData.get('slug'),
    sector: formData.get('sector'),
    market: formData.get('market'),
    tier: formData.get('tier'),
    city: formData.get('city'),
    area: formData.get('area') || undefined,
    year: formData.get('year') || undefined,
    client: formData.get('client') || undefined,
    stage: formData.get('stage') || undefined,
    services: formData.get('services') || undefined,
    resultStatement: formData.get('resultStatement') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const slug = slugify(parsed.data.slug);
  if (!slug) return { error: 'Slug must contain at least one letter or number.' };
  const existing = await prisma.portfolioProject.findUnique({ where: { slug }, select: { id: true } });
  if (existing && existing.id !== parsed.data.projectId) {
    return { error: `Slug "${slug}" is already used by another project.` };
  }

  const project = await prisma.portfolioProject.update({
    where: { id: parsed.data.projectId },
    data: {
      title: parsed.data.title,
      slug,
      sector: parsed.data.sector,
      market: parsed.data.market,
      tier: parsed.data.tier,
      city: parsed.data.city,
      area: parsed.data.area ?? '',
      year: parsed.data.year ?? '',
      client: parsed.data.client ?? null,
      stage: parsed.data.stage ?? null,
      services: parseCsv(parsed.data.services),
      resultStatement: parsed.data.resultStatement ?? null,
    },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.portfolio_project_updated', entityType: 'PortfolioProject', entityId: project.id });
  revalidatePath(`/admin/portfolio/${project.id}`);
  revalidatePublic(project.slug);
  return { success: 'Saved.' };
}

const briefSchema = z.object({
  projectId: z.string().min(1),
  briefClientProblem: z.string().trim().optional(),
  briefDefinitionalSentence: z.string().trim().optional(),
});

export async function updatePortfolioProjectBrief(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = briefSchema.safeParse({
    projectId: formData.get('projectId'),
    briefClientProblem: formData.get('briefClientProblem') || undefined,
    briefDefinitionalSentence: formData.get('briefDefinitionalSentence') || undefined,
  });
  if (!parsed.success) return { error: 'Invalid request.' };

  const project = await prisma.portfolioProject.update({
    where: { id: parsed.data.projectId },
    data: { briefClientProblem: parsed.data.briefClientProblem ?? null, briefDefinitionalSentence: parsed.data.briefDefinitionalSentence ?? null },
  });

  revalidatePath(`/admin/portfolio/${project.id}`);
  revalidatePublic(project.slug);
  return { success: 'Saved.' };
}

const designSchema = z.object({
  projectId: z.string().min(1),
  designKeyDecision: z.string().trim().optional(),
  designCaption: z.string().trim().optional(),
});

export async function updatePortfolioProjectDesign(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = designSchema.safeParse({
    projectId: formData.get('projectId'),
    designKeyDecision: formData.get('designKeyDecision') || undefined,
    designCaption: formData.get('designCaption') || undefined,
  });
  if (!parsed.success) return { error: 'Invalid request.' };

  const project = await prisma.portfolioProject.update({
    where: { id: parsed.data.projectId },
    data: { designKeyDecision: parsed.data.designKeyDecision ?? null, designCaption: parsed.data.designCaption ?? null },
  });

  revalidatePath(`/admin/portfolio/${project.id}`);
  revalidatePublic(project.slug);
  return { success: 'Saved.' };
}

const buildSchema = z.object({
  projectId: z.string().min(1),
  buildDuration: z.string().trim().optional(),
  buildChallengeResolution: z.string().trim().optional(),
  buildFeatures: z.string().optional(),
  buildCaption: z.string().trim().optional(),
});

export async function updatePortfolioProjectBuild(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = buildSchema.safeParse({
    projectId: formData.get('projectId'),
    buildDuration: formData.get('buildDuration') || undefined,
    buildChallengeResolution: formData.get('buildChallengeResolution') || undefined,
    buildFeatures: formData.get('buildFeatures') || undefined,
    buildCaption: formData.get('buildCaption') || undefined,
  });
  if (!parsed.success) return { error: 'Invalid request.' };

  const project = await prisma.portfolioProject.update({
    where: { id: parsed.data.projectId },
    data: {
      buildDuration: parsed.data.buildDuration ?? null,
      buildChallengeResolution: parsed.data.buildChallengeResolution ?? null,
      buildFeatures: parseCsv(parsed.data.buildFeatures),
      buildCaption: parsed.data.buildCaption ?? null,
    },
  });

  revalidatePath(`/admin/portfolio/${project.id}`);
  revalidatePublic(project.slug);
  return { success: 'Saved.' };
}

const resultSchema = z.object({
  projectId: z.string().min(1),
  resultOutcomes: z.string().optional(),
  resultClientQuoteText: z.string().trim().optional(),
  resultClientQuoteAuthor: z.string().trim().optional(),
  resultCaption: z.string().trim().optional(),
});

export async function updatePortfolioProjectResult(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = resultSchema.safeParse({
    projectId: formData.get('projectId'),
    resultOutcomes: formData.get('resultOutcomes') || undefined,
    resultClientQuoteText: formData.get('resultClientQuoteText') || undefined,
    resultClientQuoteAuthor: formData.get('resultClientQuoteAuthor') || undefined,
    resultCaption: formData.get('resultCaption') || undefined,
  });
  if (!parsed.success) return { error: 'Invalid request.' };

  const project = await prisma.portfolioProject.update({
    where: { id: parsed.data.projectId },
    data: {
      resultOutcomes: parseCsv(parsed.data.resultOutcomes),
      resultClientQuoteText: parsed.data.resultClientQuoteText ?? null,
      resultClientQuoteAuthor: parsed.data.resultClientQuoteAuthor ?? null,
      resultCaption: parsed.data.resultCaption ?? null,
    },
  });

  revalidatePath(`/admin/portfolio/${project.id}`);
  revalidatePublic(project.slug);
  return { success: 'Saved.' };
}

const relatedSchema = z.object({
  projectId: z.string().min(1),
  relatedProjectSlugs: z.array(z.string()),
  relatedExpertiseTitle: z.string().trim().optional(),
  relatedExpertiseHref: z.string().trim().optional(),
});

export async function updatePortfolioProjectRelated(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = relatedSchema.safeParse({
    projectId: formData.get('projectId'),
    relatedProjectSlugs: formData.getAll('relatedProjectSlugs').filter((v): v is string => typeof v === 'string'),
    relatedExpertiseTitle: formData.get('relatedExpertiseTitle') || undefined,
    relatedExpertiseHref: formData.get('relatedExpertiseHref') || undefined,
  });
  if (!parsed.success) return { error: 'Invalid request.' };

  const project = await prisma.portfolioProject.update({
    where: { id: parsed.data.projectId },
    data: {
      relatedProjectSlugs: parsed.data.relatedProjectSlugs,
      relatedExpertiseTitle: parsed.data.relatedExpertiseTitle ?? null,
      relatedExpertiseHref: parsed.data.relatedExpertiseHref ?? null,
    },
  });

  revalidatePath(`/admin/portfolio/${project.id}`);
  revalidatePublic(project.slug);
  return { success: 'Saved.' };
}

const narrativeSchema = z.object({
  projectId: z.string().min(1),
  heroHeadline: z.string().trim().optional(),
  heroSubtitle: z.string().trim().optional(),
  story: z.string().optional(),
  designPhilosophy: z.string().trim().optional(),
  whyDifferent: z.string().trim().optional(),
  clientExperience: z.string().optional(),
  ctaHeadline: z.string().trim().optional(),
  ctaSubtext: z.string().trim().optional(),
});

export async function updatePortfolioProjectNarrative(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = narrativeSchema.safeParse({
    projectId: formData.get('projectId'),
    heroHeadline: formData.get('heroHeadline') || undefined,
    heroSubtitle: formData.get('heroSubtitle') || undefined,
    story: formData.get('story') || undefined,
    designPhilosophy: formData.get('designPhilosophy') || undefined,
    whyDifferent: formData.get('whyDifferent') || undefined,
    clientExperience: formData.get('clientExperience') || undefined,
    ctaHeadline: formData.get('ctaHeadline') || undefined,
    ctaSubtext: formData.get('ctaSubtext') || undefined,
  });
  if (!parsed.success) return { error: 'Invalid request.' };

  const project = await prisma.portfolioProject.update({
    where: { id: parsed.data.projectId },
    data: {
      heroHeadline: parsed.data.heroHeadline ?? null,
      heroSubtitle: parsed.data.heroSubtitle ?? null,
      story: parseLines(parsed.data.story),
      designPhilosophy: parsed.data.designPhilosophy ?? null,
      whyDifferent: parsed.data.whyDifferent ?? null,
      clientExperience: parseLines(parsed.data.clientExperience),
      ctaHeadline: parsed.data.ctaHeadline ?? null,
      ctaSubtext: parsed.data.ctaSubtext ?? null,
    },
  });

  revalidatePath(`/admin/portfolio/${project.id}`);
  revalidatePublic(project.slug);
  return { success: 'Saved.' };
}

const seoSchema = z.object({
  projectId: z.string().min(1),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
  seoFocusKeyword: z.string().trim().optional(),
  seoSecondaryKeywords: z.string().optional(),
  seoOgTitle: z.string().trim().optional(),
  seoOgDescription: z.string().trim().optional(),
  seoTwitterTitle: z.string().trim().optional(),
  seoTwitterDescription: z.string().trim().optional(),
});

export async function updatePortfolioProjectSeo(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = seoSchema.safeParse({
    projectId: formData.get('projectId'),
    seoTitle: formData.get('seoTitle') || undefined,
    seoDescription: formData.get('seoDescription') || undefined,
    seoFocusKeyword: formData.get('seoFocusKeyword') || undefined,
    seoSecondaryKeywords: formData.get('seoSecondaryKeywords') || undefined,
    seoOgTitle: formData.get('seoOgTitle') || undefined,
    seoOgDescription: formData.get('seoOgDescription') || undefined,
    seoTwitterTitle: formData.get('seoTwitterTitle') || undefined,
    seoTwitterDescription: formData.get('seoTwitterDescription') || undefined,
  });
  if (!parsed.success) return { error: 'Invalid request.' };

  const project = await prisma.portfolioProject.update({
    where: { id: parsed.data.projectId },
    data: {
      seoTitle: parsed.data.seoTitle ?? null,
      seoDescription: parsed.data.seoDescription ?? null,
      seoFocusKeyword: parsed.data.seoFocusKeyword ?? null,
      seoSecondaryKeywords: parseCsv(parsed.data.seoSecondaryKeywords),
      seoOgTitle: parsed.data.seoOgTitle ?? null,
      seoOgDescription: parsed.data.seoOgDescription ?? null,
      seoTwitterTitle: parsed.data.seoTwitterTitle ?? null,
      seoTwitterDescription: parsed.data.seoTwitterDescription ?? null,
    },
  });

  revalidatePath(`/admin/portfolio/${project.id}`);
  revalidatePublic(project.slug);
  return { success: 'Saved.' };
}

// ── Images ──
// Every image control (4 singular slots + 3 gallery sections) uploads
// directly through the same MediaAsset pipeline admin/media's own
// upload form uses (runMediaPipeline + storage) — one form submit both
// uploads the file and attaches it, rather than the News admin's
// two-step "upload in the Media Library, come back, pick from a
// select" flow. A migrated project's legacy externalUrl stays exactly
// as the migration script set it until an admin replaces it.

const SINGULAR_SLOTS = {
  hero: { idField: 'heroImageId', urlField: 'heroImageUrl' },
  hubFlagship: { idField: 'hubFlagshipImageId', urlField: 'hubFlagshipImageUrl' },
  hubPair: { idField: 'hubPairImageId', urlField: 'hubPairImageUrl' },
  og: { idField: 'ogImageId', urlField: 'ogImageUrl' },
} as const;

async function uploadImageAsset(file: File, uploadedById: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const pipelineResult = await runMediaPipeline({
    buffer,
    fileName: file.name,
    declaredType: file.type,
    kind: 'IMAGE',
    generateVariants: true,
  });
  return prisma.mediaAsset.create({
    data: {
      kind: 'IMAGE',
      storageKey: pipelineResult.storageKey,
      fileName: file.name,
      fileType: pipelineResult.fileType,
      fileSize: pipelineResult.fileSize,
      width: pipelineResult.width,
      height: pipelineResult.height,
      orientation: pipelineResult.orientation,
      dominantColors: pipelineResult.dominantColors,
      uploadedById,
      variants: { create: pipelineResult.variants.map((v) => ({ purpose: v.purpose, storageKey: v.storageKey, width: v.width, height: v.height })) },
    },
  });
}

const singularImageSchema = z.object({
  projectId: z.string().min(1),
  slot: z.enum(['hero', 'hubFlagship', 'hubPair', 'og']),
});

export async function setPortfolioProjectSingularImage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = singularImageSchema.safeParse({ projectId: formData.get('projectId'), slot: formData.get('slot') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose an image file.' };
  }

  let asset;
  try {
    asset = await uploadImageAsset(file, principal.userId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Upload failed.' };
  }

  const { idField, urlField } = SINGULAR_SLOTS[parsed.data.slot];
  const project = await prisma.portfolioProject.update({
    where: { id: parsed.data.projectId },
    data: { [idField]: asset.id, [urlField]: null },
  });

  await prisma.mediaAssetUsage.upsert({
    where: { assetId_entityType_entityId: { assetId: asset.id, entityType: 'PortfolioProject', entityId: parsed.data.projectId } },
    update: {},
    create: { assetId: asset.id, entityType: 'PortfolioProject', entityId: parsed.data.projectId },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.portfolio_project_image_set', entityType: 'PortfolioProject', entityId: parsed.data.projectId, metadata: { slot: parsed.data.slot } });

  revalidatePath(`/admin/portfolio/${parsed.data.projectId}`);
  revalidatePublic(project.slug);
  return { success: 'Image updated.' };
}

export async function clearPortfolioProjectSingularImage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = singularImageSchema.safeParse({ projectId: formData.get('projectId'), slot: formData.get('slot') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const { idField, urlField } = SINGULAR_SLOTS[parsed.data.slot];
  const project = await prisma.portfolioProject.update({
    where: { id: parsed.data.projectId },
    data: { [idField]: null, [urlField]: null },
  });

  revalidatePath(`/admin/portfolio/${parsed.data.projectId}`);
  revalidatePublic(project.slug);
  return { success: 'Image cleared.' };
}

const galleryImageSchema = z.object({
  projectId: z.string().min(1),
  section: z.enum(['DESIGN', 'BUILD', 'RESULT']),
});

export async function addPortfolioProjectGalleryImage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = galleryImageSchema.safeParse({ projectId: formData.get('projectId'), section: formData.get('section') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose an image file.' };
  }

  let asset;
  try {
    asset = await uploadImageAsset(file, principal.userId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Upload failed.' };
  }

  const count = await prisma.portfolioProjectImage.count({ where: { projectId: parsed.data.projectId, section: parsed.data.section } });
  await prisma.portfolioProjectImage.create({
    data: { projectId: parsed.data.projectId, section: parsed.data.section, assetId: asset.id, sortOrder: count },
  });
  await prisma.mediaAssetUsage.upsert({
    where: { assetId_entityType_entityId: { assetId: asset.id, entityType: 'PortfolioProject', entityId: parsed.data.projectId } },
    update: {},
    create: { assetId: asset.id, entityType: 'PortfolioProject', entityId: parsed.data.projectId },
  });

  const project = await prisma.portfolioProject.findUnique({ where: { id: parsed.data.projectId }, select: { slug: true } });
  revalidatePath(`/admin/portfolio/${parsed.data.projectId}`);
  revalidatePublic(project?.slug);
  return { success: 'Added to gallery.' };
}

const removeGalleryImageSchema = z.object({ projectId: z.string().min(1), imageId: z.string().min(1) });

export async function removePortfolioProjectGalleryImage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = removeGalleryImageSchema.safeParse({ projectId: formData.get('projectId'), imageId: formData.get('imageId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.portfolioProjectImage.delete({ where: { id: parsed.data.imageId, projectId: parsed.data.projectId } });

  const project = await prisma.portfolioProject.findUnique({ where: { id: parsed.data.projectId }, select: { slug: true } });
  revalidatePath(`/admin/portfolio/${parsed.data.projectId}`);
  revalidatePublic(project?.slug);
  return { success: 'Removed from gallery.' };
}

// ── FAQ ──

const addFaqSchema = z.object({
  projectId: z.string().min(1),
  question: z.string().trim().min(1, 'Question is required.'),
  answer: z.string().trim().min(1, 'Answer is required.'),
});

export async function addPortfolioProjectFaqItem(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = addFaqSchema.safeParse({
    projectId: formData.get('projectId'),
    question: formData.get('question'),
    answer: formData.get('answer'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const count = await prisma.portfolioProjectFaqItem.count({ where: { projectId: parsed.data.projectId } });
  await prisma.portfolioProjectFaqItem.create({
    data: { projectId: parsed.data.projectId, question: parsed.data.question, answer: parsed.data.answer, sortOrder: count },
  });

  const project = await prisma.portfolioProject.findUnique({ where: { id: parsed.data.projectId }, select: { slug: true } });
  revalidatePath(`/admin/portfolio/${parsed.data.projectId}`);
  revalidatePublic(project?.slug);
  return { success: 'FAQ item added.' };
}

const removeFaqSchema = z.object({ projectId: z.string().min(1), faqItemId: z.string().min(1) });

export async function removePortfolioProjectFaqItem(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = removeFaqSchema.safeParse({ projectId: formData.get('projectId'), faqItemId: formData.get('faqItemId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.portfolioProjectFaqItem.delete({ where: { id: parsed.data.faqItemId, projectId: parsed.data.projectId } });

  const project = await prisma.portfolioProject.findUnique({ where: { id: parsed.data.projectId }, select: { slug: true } });
  revalidatePath(`/admin/portfolio/${parsed.data.projectId}`);
  revalidatePublic(project?.slug);
  return { success: 'FAQ item removed.' };
}

// ── Publish / Delete ──

const publishSchema = z.object({ projectId: z.string().min(1) });

export async function publishPortfolioProject(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = publishSchema.safeParse({ projectId: formData.get('projectId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const existing = await prisma.portfolioProject.findUnique({ where: { id: parsed.data.projectId } });
  if (!existing) return { error: 'Not found.' };
  if (!existing.ogImageId && !existing.ogImageUrl) {
    return { error: 'Set an Open Graph image before publishing — required for how the project appears when shared.' };
  }

  const project = await prisma.portfolioProject.update({ where: { id: parsed.data.projectId }, data: { status: 'PUBLISHED' } });
  await recordActivity({ actorId: principal.userId, action: 'admin.portfolio_project_published', entityType: 'PortfolioProject', entityId: project.id });

  revalidatePath(`/admin/portfolio/${project.id}`);
  revalidatePath('/admin/portfolio');
  revalidatePublic(project.slug);
  return { success: 'Published — now live on the public site.' };
}

export async function unpublishPortfolioProject(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = publishSchema.safeParse({ projectId: formData.get('projectId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const project = await prisma.portfolioProject.update({ where: { id: parsed.data.projectId }, data: { status: 'DRAFT' } });
  await recordActivity({ actorId: principal.userId, action: 'admin.portfolio_project_unpublished', entityType: 'PortfolioProject', entityId: project.id });

  revalidatePath(`/admin/portfolio/${project.id}`);
  revalidatePath('/admin/portfolio');
  revalidatePublic(project.slug);
  return { success: 'Unpublished — removed from the public site.' };
}

// ── One-time legacy import ──
// Ports every project from the static packages/ui-components/src/data/
// projects.ts file into real rows — see
// scripts/migrate-portfolio-projects.ts for the standalone-script
// equivalent (can't reach production's DATABASE_URL from a local
// shell, since Vercel marks it sensitive; this in-app action is how
// the real one-time production import actually runs). Shares its exact
// mapping logic with that script via portfolio-legacy-import.ts.
// Idempotent — skips any slug that already exists, never overwrites.

export async function previewLegacyPortfolioImport(_prevState: ActionState, _formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const failures = legacyProjects.map(validateEnums).filter((f): f is string => f !== null);
  if (failures.length > 0) {
    return { error: `${failures.length} project(s) would fail: ${failures.join('; ')}` };
  }

  const existingSlugs = new Set(
    (await prisma.portfolioProject.findMany({ select: { slug: true } })).map((p) => p.slug),
  );
  const toCreate = legacyProjects.filter((p) => !existingSlugs.has(p.slug));
  const { missing } = buildSortOrders(legacyProjects);

  return {
    success: `Preview: ${toCreate.length} project(s) would be imported, ${legacyProjects.length - toCreate.length} already exist and would be skipped.${missing.length > 0 ? ` ${missing.length} not in the curated display order, would sort last.` : ''}`,
  };
}

export async function runLegacyPortfolioImport(_prevState: ActionState, _formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const failures = legacyProjects.map(validateEnums).filter((f): f is string => f !== null);
  if (failures.length > 0) {
    return { error: `Aborted — ${failures.length} project(s) would fail: ${failures.join('; ')}` };
  }

  const { order: sortOrders } = buildSortOrders(legacyProjects);
  let created = 0;
  let skipped = 0;

  for (const project of legacyProjects) {
    const existing = await prisma.portfolioProject.findUnique({ where: { slug: project.slug }, select: { id: true } });
    if (existing) {
      skipped += 1;
      continue;
    }
    const data = buildCreateData(project, sortOrders.get(project.slug) ?? 0) as Prisma.PortfolioProjectCreateInput;
    await prisma.portfolioProject.create({ data });
    created += 1;
  }

  await recordActivity({ actorId: principal.userId, action: 'admin.portfolio_legacy_import_run', entityType: 'PortfolioProject', metadata: { created, skipped } });

  revalidatePath('/admin/portfolio');
  revalidatePublic();
  return { success: `Imported ${created} project(s), skipped ${skipped} already-migrated.` };
}

export async function deletePortfolioProject(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = publishSchema.safeParse({ projectId: formData.get('projectId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const project = await prisma.portfolioProject.findUnique({ where: { id: parsed.data.projectId } });
  if (!project) return { error: 'Not found.' };
  if (project.status === 'PUBLISHED') {
    return { error: 'Unpublish this project before deleting it.' };
  }

  await prisma.portfolioProject.delete({ where: { id: parsed.data.projectId } });
  await recordActivity({ actorId: principal.userId, action: 'admin.portfolio_project_deleted', entityType: 'PortfolioProject', entityId: parsed.data.projectId });

  revalidatePath('/admin/portfolio');
  return { success: 'Deleted.' };
}
