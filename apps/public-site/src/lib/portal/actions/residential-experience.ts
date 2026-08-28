'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

// Gated to SUPER_ADMIN_ONLY throughout — same reasoning as Office's
// legal-info action: entries here can name a real third-party developer
// publicly, which carries the same reputational/legal weight as the
// legal/registration fields, not ordinary content editing.

const baseFieldsSchema = {
  name: z.string().trim().min(1, 'Community name is required.'),
  developerName: z.string().trim().optional(),
  developerVerified: z.boolean(),
  country: z.string().trim().min(1),
  city: z.string().trim().optional(),
  region: z.string().trim().optional(),
  projectType: z.string().trim().optional(),
  experienceCategory: z.enum(['CURRENT_AHW_PROJECT', 'PREVIOUS_AHW_EXPERIENCE', 'TEAM_PROFESSIONAL_EXPERIENCE', 'COLLABORATIVE_INVOLVEMENT', 'TARGET_COMMUNITY']),
  scope: z.string().trim().optional(),
  experiencePeriod: z.string().trim().optional(),
  publicWording: z.string().trim().min(1, 'Public wording is required.'),
  linkedProjectSlug: z.string().trim().optional(),
  internalNotes: z.string().trim().optional(),
  confidence: z.string().trim().optional(),
  status: z.enum(['VERIFIED', 'REVIEW_REQUIRED', 'TARGET']),
  publicDisplay: z.boolean(),
  displayOrder: z.coerce.number().int(),
};

function readForm(formData: FormData) {
  return z.object(baseFieldsSchema).safeParse({
    name: formData.get('name'),
    developerName: formData.get('developerName') || '',
    developerVerified: formData.get('developerVerified') === 'on',
    country: formData.get('country') || 'Egypt',
    city: formData.get('city') || '',
    region: formData.get('region') || '',
    projectType: formData.get('projectType') || '',
    experienceCategory: formData.get('experienceCategory'),
    scope: formData.get('scope') || '',
    experiencePeriod: formData.get('experiencePeriod') || '',
    publicWording: formData.get('publicWording'),
    linkedProjectSlug: formData.get('linkedProjectSlug') || '',
    internalNotes: formData.get('internalNotes') || '',
    confidence: formData.get('confidence') || '',
    status: formData.get('status') ?? 'REVIEW_REQUIRED',
    publicDisplay: formData.get('publicDisplay') === 'on',
    displayOrder: formData.get('displayOrder') || '0',
  });
}

export async function createResidentialExperience(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = readForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const data = parsed.data;

  const created = await prisma.residentialExperience.create({
    data: {
      name: data.name,
      developerName: data.developerName || null,
      developerVerified: data.developerVerified,
      country: data.country,
      city: data.city || null,
      region: data.region || null,
      projectType: data.projectType || null,
      experienceCategory: data.experienceCategory,
      scope: data.scope || null,
      experiencePeriod: data.experiencePeriod || null,
      publicWording: data.publicWording,
      linkedProjectSlug: data.linkedProjectSlug || null,
      internalNotes: data.internalNotes || null,
      confidence: data.confidence || null,
      status: data.status,
      publicDisplay: data.publicDisplay,
      displayOrder: data.displayOrder,
    },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.residential_experience_created', entityType: 'ResidentialExperience', entityId: created.id });
  revalidatePath('/admin/residential-experience');
  revalidatePath('/residential');
  redirect(`/admin/residential-experience/${created.id}`);
}

const idSchema = z.object({ id: z.string().min(1) });

export async function updateResidentialExperience(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const idParsed = idSchema.safeParse({ id: formData.get('id') });
  if (!idParsed.success) return { error: 'Invalid request.' };

  const parsed = readForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const data = parsed.data;

  await prisma.residentialExperience.update({
    where: { id: idParsed.data.id },
    data: {
      name: data.name,
      developerName: data.developerName || null,
      developerVerified: data.developerVerified,
      country: data.country,
      city: data.city || null,
      region: data.region || null,
      projectType: data.projectType || null,
      experienceCategory: data.experienceCategory,
      scope: data.scope || null,
      experiencePeriod: data.experiencePeriod || null,
      publicWording: data.publicWording,
      linkedProjectSlug: data.linkedProjectSlug || null,
      internalNotes: data.internalNotes || null,
      confidence: data.confidence || null,
      status: data.status,
      publicDisplay: data.publicDisplay,
      displayOrder: data.displayOrder,
    },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.residential_experience_updated', entityType: 'ResidentialExperience', entityId: idParsed.data.id });
  revalidatePath('/admin/residential-experience');
  revalidatePath(`/admin/residential-experience/${idParsed.data.id}`);
  revalidatePath('/residential');
  return { success: 'Saved.' };
}

export async function archiveResidentialExperience(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = idSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.residentialExperience.update({ where: { id: parsed.data.id }, data: { archivedAt: new Date() } });
  await recordActivity({ actorId: principal.userId, action: 'admin.residential_experience_archived', entityType: 'ResidentialExperience', entityId: parsed.data.id });
  revalidatePath('/admin/residential-experience');
  revalidatePath('/residential');
  return { success: 'Archived.' };
}

export async function restoreResidentialExperience(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = idSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.residentialExperience.update({ where: { id: parsed.data.id }, data: { archivedAt: null } });
  await recordActivity({ actorId: principal.userId, action: 'admin.residential_experience_restored', entityType: 'ResidentialExperience', entityId: parsed.data.id });
  revalidatePath('/admin/residential-experience');
  revalidatePath('/residential');
  return { success: 'Restored.' };
}

export async function deleteResidentialExperience(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = idSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.residentialExperience.delete({ where: { id: parsed.data.id } });
  await recordActivity({ actorId: principal.userId, action: 'admin.residential_experience_deleted', entityType: 'ResidentialExperience', entityId: parsed.data.id });
  revalidatePath('/admin/residential-experience');
  revalidatePath('/residential');
  redirect('/admin/residential-experience');
}
