'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const createSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  description: z.string().trim().optional(),
});

// The top-level marketing object: a container, not a workflow. Articles,
// social posts, generated graphics, and landing pages each carry an
// optional campaignId (set from their own editors) — this action only
// creates the container they join.
export async function createCampaign(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = createSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const baseSlug = slugify(parsed.data.name);
  if (!baseSlug) {
    return { error: 'Name must contain at least one letter or number.' };
  }
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.campaign.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const campaign = await prisma.campaign.create({
    data: { name: parsed.data.name, slug, description: parsed.data.description ?? null, createdById: principal.userId },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.campaign_created', entityType: 'Campaign', entityId: campaign.id });
  revalidatePath('/admin/campaigns');
  redirect(`/admin/campaigns/${campaign.id}`);
}

const updateSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().trim().min(1, 'Name is required.'),
  description: z.string().trim().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function updateCampaign(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = updateSchema.safeParse({
    campaignId: formData.get('campaignId'),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    status: formData.get('status'),
    startDate: formData.get('startDate') || undefined,
    endDate: formData.get('endDate') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  await prisma.campaign.update({
    where: { id: parsed.data.campaignId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.campaign_updated', entityType: 'Campaign', entityId: parsed.data.campaignId });
  revalidatePath(`/admin/campaigns/${parsed.data.campaignId}`);
  return { success: 'Campaign updated.' };
}

const linkArticleSchema = z.object({ campaignId: z.string().min(1), newsPostId: z.string().min(1) });

export async function linkArticleToCampaign(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = linkArticleSchema.safeParse({ campaignId: formData.get('campaignId'), newsPostId: formData.get('newsPostId') });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  await prisma.newsPost.update({ where: { id: parsed.data.newsPostId }, data: { campaignId: parsed.data.campaignId } });

  await recordActivity({ actorId: principal.userId, action: 'admin.campaign_article_linked', entityType: 'Campaign', entityId: parsed.data.campaignId });
  revalidatePath(`/admin/campaigns/${parsed.data.campaignId}`);
  return { success: 'Article linked to campaign.' };
}
