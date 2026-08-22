'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { STAFF_ROLES, SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

// Comma/newline-separated multi-value fields (phones, emails) — the same
// "one input, split on submit" pattern used elsewhere in this admin for
// String[] columns, rather than a repeating-field-group widget.
function splitList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== 'string') return [];
  return value
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const officeSchema = z.object({
  name: z.string().trim().min(1, 'Internal name is required.'),
  displayName: z.string().trim().min(1, 'Public display name is required.'),
  slug: z.string().trim().min(1, 'Slug is required.'),
  country: z.string().trim().min(1, 'Country is required.'),
  city: z.string().trim().min(1, 'City is required.'),
  isHeadquarters: z.boolean(),
  addressFull: z.string().trim().min(1, 'Address is required.'),
  addressStreet: z.string().trim().optional(),
  addressBuilding: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  mapLink: z.string().trim().optional(),
  mapEmbedUrl: z.string().trim().optional(),
  phones: z.array(z.string()).min(1, 'At least one phone number is required.'),
  emails: z.array(z.string().email('Enter valid emails only.')).min(1, 'At least one email is required.'),
  website: z.string().trim().optional(),
  workingHours: z.string().trim().optional(),
  timezone: z.string().trim().optional(),
  defaultLanguage: z.string().trim().min(1),
  googleBusinessProfileUrl: z.string().trim().optional(),
  ctaLabel: z.string().trim().optional(),
  ctaUrl: z.string().trim().optional(),
  logoOverrideId: z.string().trim().optional(),
  qrCodeAssetId: z.string().trim().optional(),
  instagramUrl: z.string().trim().optional(),
  facebookUrl: z.string().trim().optional(),
  linkedinUrl: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  bookingUrl: z.string().trim().optional(),
});

function readOfficeForm(formData: FormData) {
  const rawSlug = formData.get('slug');
  const rawDisplayName = formData.get('displayName');
  const slugSource = (typeof rawSlug === 'string' && rawSlug) || (typeof rawDisplayName === 'string' && rawDisplayName) || '';

  return officeSchema.safeParse({
    name: formData.get('name'),
    displayName: formData.get('displayName'),
    slug: slugify(slugSource),
    country: formData.get('country'),
    city: formData.get('city'),
    isHeadquarters: formData.get('isHeadquarters') === 'on',
    addressFull: formData.get('addressFull'),
    addressStreet: formData.get('addressStreet') || undefined,
    addressBuilding: formData.get('addressBuilding') || undefined,
    postalCode: formData.get('postalCode') || undefined,
    mapLink: formData.get('mapLink') || undefined,
    mapEmbedUrl: formData.get('mapEmbedUrl') || undefined,
    phones: splitList(formData.get('phones')),
    emails: splitList(formData.get('emails')),
    website: formData.get('website') || undefined,
    workingHours: formData.get('workingHours') || undefined,
    timezone: formData.get('timezone') || undefined,
    defaultLanguage: formData.get('defaultLanguage') || 'en',
    googleBusinessProfileUrl: formData.get('googleBusinessProfileUrl') || undefined,
    ctaLabel: formData.get('ctaLabel') || undefined,
    ctaUrl: formData.get('ctaUrl') || undefined,
    logoOverrideId: formData.get('logoOverrideId') || undefined,
    qrCodeAssetId: formData.get('qrCodeAssetId') || undefined,
    instagramUrl: formData.get('instagramUrl') || undefined,
    facebookUrl: formData.get('facebookUrl') || undefined,
    linkedinUrl: formData.get('linkedinUrl') || undefined,
    whatsapp: formData.get('whatsapp') || undefined,
    bookingUrl: formData.get('bookingUrl') || undefined,
  });
}

function buildSocialLinks(data: z.infer<typeof officeSchema>) {
  const links: Record<string, string> = {};
  if (data.instagramUrl) links.instagram = data.instagramUrl;
  if (data.facebookUrl) links.facebook = data.facebookUrl;
  if (data.linkedinUrl) links.linkedin = data.linkedinUrl;
  if (data.whatsapp) links.whatsapp = data.whatsapp;
  if (data.bookingUrl) links.bookingUrl = data.bookingUrl;
  return links;
}

// Offices are the multi-office architecture's core entity — every future
// office (UAE, Saudi Arabia, Qatar, ...) is created here, never in code.
// STAFF_ROLES (not just SUPER_ADMIN) can manage them, same tier as
// Clients/Projects, since Offices are day-to-day operational data, not a
// security-sensitive system setting.
export async function createOffice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = readOfficeForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const data = parsed.data;

  const existing = await prisma.office.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return { error: `An office with the slug "${data.slug}" already exists.` };
  }

  const officeCount = await prisma.office.count();

  const office = await prisma.office.create({
    data: {
      name: data.name,
      displayName: data.displayName,
      slug: data.slug,
      country: data.country,
      city: data.city,
      isHeadquarters: data.isHeadquarters,
      sortOrder: officeCount,
      addressFull: data.addressFull,
      addressStreet: data.addressStreet ?? null,
      addressBuilding: data.addressBuilding ?? null,
      postalCode: data.postalCode ?? null,
      mapLink: data.mapLink ?? null,
      mapEmbedUrl: data.mapEmbedUrl ?? null,
      phones: data.phones,
      emails: data.emails,
      website: data.website ?? null,
      workingHours: data.workingHours ?? null,
      timezone: data.timezone ?? null,
      defaultLanguage: data.defaultLanguage,
      googleBusinessProfileUrl: data.googleBusinessProfileUrl ?? null,
      socialLinks: buildSocialLinks(data),
      ctaLabel: data.ctaLabel ?? null,
      ctaUrl: data.ctaUrl ?? null,
      logoOverrideId: data.logoOverrideId ?? null,
      qrCodeAssetId: data.qrCodeAssetId ?? null,
    },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.office_created', entityType: 'Office', entityId: office.id, metadata: { slug: office.slug } });

  revalidatePath('/admin/offices');
  redirect('/admin/offices');
}

const officeIdSchema = z.object({ officeId: z.string().min(1) });

export async function updateOffice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const officeIdRaw = formData.get('officeId');
  const officeId = typeof officeIdRaw === 'string' ? officeIdRaw : '';
  if (!officeId) return { error: 'Invalid request.' };

  const parsed = readOfficeForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const data = parsed.data;

  const existing = await prisma.office.findUnique({ where: { slug: data.slug } });
  if (existing && existing.id !== officeId) {
    return { error: `An office with the slug "${data.slug}" already exists.` };
  }

  await prisma.office.update({
    where: { id: officeId },
    data: {
      name: data.name,
      displayName: data.displayName,
      slug: data.slug,
      country: data.country,
      city: data.city,
      isHeadquarters: data.isHeadquarters,
      addressFull: data.addressFull,
      addressStreet: data.addressStreet ?? null,
      addressBuilding: data.addressBuilding ?? null,
      postalCode: data.postalCode ?? null,
      mapLink: data.mapLink ?? null,
      mapEmbedUrl: data.mapEmbedUrl ?? null,
      phones: data.phones,
      emails: data.emails,
      website: data.website ?? null,
      workingHours: data.workingHours ?? null,
      timezone: data.timezone ?? null,
      defaultLanguage: data.defaultLanguage,
      googleBusinessProfileUrl: data.googleBusinessProfileUrl ?? null,
      socialLinks: buildSocialLinks(data),
      ctaLabel: data.ctaLabel ?? null,
      ctaUrl: data.ctaUrl ?? null,
      logoOverrideId: data.logoOverrideId ?? null,
      qrCodeAssetId: data.qrCodeAssetId ?? null,
    },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.office_updated', entityType: 'Office', entityId: officeId });

  revalidatePath('/admin/offices');
  revalidatePath(`/admin/offices/${officeId}`);
  return { success: 'Office updated.' };
}

export async function archiveOffice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = officeIdSchema.safeParse({ officeId: formData.get('officeId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const activeCount = await prisma.office.count({ where: { status: 'ACTIVE' } });
  const target = await prisma.office.findUnique({ where: { id: parsed.data.officeId } });
  if (target?.status === 'ACTIVE' && activeCount <= 1) {
    return { error: 'At least one office must stay active — the public site (Contact, Capability Statement, footer) needs at least one to render.' };
  }

  await prisma.office.update({ where: { id: parsed.data.officeId }, data: { status: 'ARCHIVED' } });
  await recordActivity({ actorId: principal.userId, action: 'admin.office_archived', entityType: 'Office', entityId: parsed.data.officeId });
  revalidatePath('/admin/offices');
  return { success: 'Office archived — hidden from the public site, kept for historical Clients/Projects.' };
}

export async function restoreOffice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, STAFF_ROLES);

  const parsed = officeIdSchema.safeParse({ officeId: formData.get('officeId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  await prisma.office.update({ where: { id: parsed.data.officeId }, data: { status: 'ACTIVE' } });
  await recordActivity({ actorId: principal.userId, action: 'admin.office_restored', entityType: 'Office', entityId: parsed.data.officeId });
  revalidatePath('/admin/offices');
  return { success: 'Office restored — visible on the public site again.' };
}

// Hard delete — only reaches the database when nothing references this
// office (Prisma's own FK RESTRICT on Client/Project/SocialPost/
// PublishingDestination/IntegrationConfig is the real safety net here,
// same "trust the DB constraint" principle as Client/deleteClient).
export async function deleteOffice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = officeIdSchema.safeParse({ officeId: formData.get('officeId') });
  if (!parsed.success) return { error: 'Invalid request.' };

  const [clientCount, projectCount] = await Promise.all([
    prisma.client.count({ where: { officeId: parsed.data.officeId } }),
    prisma.project.count({ where: { officeId: parsed.data.officeId } }),
  ]);
  if (clientCount > 0 || projectCount > 0) {
    return { error: 'This office has Clients or Projects — archive instead of deleting to keep that history.' };
  }

  await prisma.$transaction([
    prisma.integrationConfig.deleteMany({ where: { officeId: parsed.data.officeId } }),
    prisma.publishingDestination.deleteMany({ where: { officeId: parsed.data.officeId } }),
    prisma.office.delete({ where: { id: parsed.data.officeId } }),
  ]);

  await recordActivity({ actorId: principal.userId, action: 'admin.office_deleted', entityType: 'Office', entityId: parsed.data.officeId });
  revalidatePath('/admin/offices');
  return { success: 'Office deleted.' };
}
