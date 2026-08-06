'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, requireRole } from '../auth-guard';
import { SUPER_ADMIN_ONLY } from '../roles';
import { prisma } from '../db';
import { getActiveBrandKit, toJsonValue } from '../brand-kit';
import { recordActivity } from '../audit';
import type { ActionState } from '../../../components/portal/ActionForm';

// Brand Kit changes affect every future template render and QR code site-
// wide — restricted to SUPER_ADMIN, unlike most content actions (STAFF_ROLES).

const colorsSchema = z.object({
  ink: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Enter a hex color like #0F1115.'),
  paper: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Enter a hex color.'),
  stone: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Enter a hex color.'),
  accentDark: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Enter a hex color.'),
  accentLight: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Enter a hex color.'),
});

export async function updateBrandColors(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = colorsSchema.safeParse({
    ink: formData.get('ink'),
    paper: formData.get('paper'),
    stone: formData.get('stone'),
    accentDark: formData.get('accentDark'),
    accentLight: formData.get('accentLight'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const kit = await getActiveBrandKit();
  await prisma.brandKit.update({ where: { id: kit.id }, data: { colors: toJsonValue(parsed.data) } });

  await recordActivity({ actorId: principal.userId, action: 'admin.brand_kit_colors_updated', entityType: 'BrandKit', entityId: kit.id });
  revalidatePath('/admin/brand-kit');
  return { success: 'Colors updated.' };
}

const typographySchema = z.object({
  primaryFont: z.string().trim().min(1),
  secondaryFont: z.string().trim().min(1),
  weightLight: z.coerce.number().int().min(100).max(900),
  weightRegular: z.coerce.number().int().min(100).max(900),
  weightMedium: z.coerce.number().int().min(100).max(900),
});

export async function updateBrandTypography(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = typographySchema.safeParse({
    primaryFont: formData.get('primaryFont'),
    secondaryFont: formData.get('secondaryFont'),
    weightLight: formData.get('weightLight'),
    weightRegular: formData.get('weightRegular'),
    weightMedium: formData.get('weightMedium'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const kit = await getActiveBrandKit();
  await prisma.brandKit.update({ where: { id: kit.id }, data: { typography: toJsonValue(parsed.data) } });

  await recordActivity({ actorId: principal.userId, action: 'admin.brand_kit_typography_updated', entityType: 'BrandKit', entityId: kit.id });
  revalidatePath('/admin/brand-kit');
  return { success: 'Typography updated.' };
}

const ctaSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  background: z.string().trim().min(1),
  foreground: z.string().trim().min(1),
});

export async function upsertCtaStyle(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = ctaSchema.safeParse({
    key: formData.get('key'),
    label: formData.get('label'),
    background: formData.get('background'),
    foreground: formData.get('foreground'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const kit = await getActiveBrandKit();
  const currentStyles = (kit.ctaStyles as Record<string, unknown>) ?? {};
  const nextStyles = {
    ...currentStyles,
    [parsed.data.key]: { label: parsed.data.label, background: parsed.data.background, foreground: parsed.data.foreground },
  };

  await prisma.brandKit.update({ where: { id: kit.id }, data: { ctaStyles: toJsonValue(nextStyles) } });

  await recordActivity({ actorId: principal.userId, action: 'admin.brand_kit_cta_updated', entityType: 'BrandKit', entityId: kit.id, metadata: { key: parsed.data.key } });
  revalidatePath('/admin/brand-kit');
  return { success: `CTA style "${parsed.data.key}" saved.` };
}

const logosSchema = z.object({
  light: z.string().optional(),
  dark: z.string().optional(),
  icon: z.string().optional(),
});

export async function updateBrandLogos(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = logosSchema.safeParse({
    light: formData.get('light') || undefined,
    dark: formData.get('dark') || undefined,
    icon: formData.get('icon') || undefined,
  });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  // Existence validated here since logos are stored as plain id strings in
  // JSON, not a DB-enforced FK (see schema.prisma's BrandKit comment).
  const ids = [parsed.data.light, parsed.data.dark, parsed.data.icon].filter((id): id is string => Boolean(id));
  if (ids.length > 0) {
    const found = await prisma.mediaAsset.count({ where: { id: { in: ids }, kind: { in: ['LOGO', 'ICON'] } } });
    if (found !== ids.length) {
      return { error: 'One or more selected assets could not be found or are not logos/icons.' };
    }
  }

  const kit = await getActiveBrandKit();
  await prisma.brandKit.update({
    where: { id: kit.id },
    data: { logos: toJsonValue({ light: parsed.data.light ?? null, dark: parsed.data.dark ?? null, icon: parsed.data.icon ?? null }) },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.brand_kit_logos_updated', entityType: 'BrandKit', entityId: kit.id });
  revalidatePath('/admin/brand-kit');
  return { success: 'Logos updated.' };
}

const watermarkSchema = z.object({
  assetId: z.string().min(1),
  opacity: z.coerce.number().min(0).max(1),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']),
});

export async function updateBrandWatermark(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = watermarkSchema.safeParse({
    assetId: formData.get('assetId'),
    opacity: formData.get('opacity'),
    position: formData.get('position'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const asset = await prisma.mediaAsset.findUnique({ where: { id: parsed.data.assetId } });
  if (!asset) {
    return { error: 'Selected asset not found.' };
  }

  const kit = await getActiveBrandKit();
  await prisma.brandKit.update({ where: { id: kit.id }, data: { watermark: toJsonValue(parsed.data) } });

  await recordActivity({ actorId: principal.userId, action: 'admin.brand_kit_watermark_updated', entityType: 'BrandKit', entityId: kit.id });
  revalidatePath('/admin/brand-kit');
  return { success: 'Watermark updated.' };
}

const qrStyleSchema = z.object({
  foreground: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Enter a hex color.'),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Enter a hex color.'),
  logoOverlay: z.enum(['true', 'false']),
});

export async function updateBrandQrStyle(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);

  const parsed = qrStyleSchema.safeParse({
    foreground: formData.get('foreground'),
    background: formData.get('background'),
    logoOverlay: formData.get('logoOverlay') ?? 'false',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const kit = await getActiveBrandKit();
  await prisma.brandKit.update({
    where: { id: kit.id },
    data: { qrCodeStyle: toJsonValue({ foreground: parsed.data.foreground, background: parsed.data.background, logoOverlay: parsed.data.logoOverlay === 'true' }) },
  });

  await recordActivity({ actorId: principal.userId, action: 'admin.brand_kit_qr_style_updated', entityType: 'BrandKit', entityId: kit.id });
  revalidatePath('/admin/brand-kit');
  return { success: 'QR code style updated.' };
}

// ── Go-live extension: company/contact/social/CTA/voice/footer ──
// Everything below follows the same pattern as the fields above — read
// the one active BrandKit row, write one JSON column, log it. Templates,
// generated graphics, and AI-written captions now read these instead of
// any hardcoded string.

const companyInfoSchema = z.object({
  legalName: z.string().trim().min(1, 'Legal name is required.'),
  tagline: z.string().trim().optional(),
  founded: z.string().trim().optional(),
});

export async function updateCompanyInfo(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = companyInfoSchema.safeParse({
    legalName: formData.get('legalName'),
    tagline: formData.get('tagline') || '',
    founded: formData.get('founded') || '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const kit = await getActiveBrandKit();
  await prisma.brandKit.update({ where: { id: kit.id }, data: { companyInfo: toJsonValue(parsed.data) } });
  await recordActivity({ actorId: principal.userId, action: 'admin.brand_kit_company_info_updated', entityType: 'BrandKit', entityId: kit.id });
  revalidatePath('/admin/brand-kit');
  return { success: 'Company information updated.' };
}

// The Public Website Domain — deliberately separate from Company
// information's legalName above. Every canonical URL / Open Graph tag /
// QR code / generated PDF / email template in this app reads this
// through lib/site-config.ts's getSiteUrl(), so changing it here
// propagates everywhere without a code change.
const websiteDomainSchema = z.object({
  websiteUrl: z.string().trim().url('Enter a full URL, e.g. https://ahwspaces.com'),
});

export async function updateWebsiteDomain(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = websiteDomainSchema.safeParse({ websiteUrl: formData.get('websiteUrl') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const kit = await getActiveBrandKit();
  await prisma.brandKit.update({ where: { id: kit.id }, data: { websiteUrl: parsed.data.websiteUrl.replace(/\/+$/, '') } });
  await recordActivity({ actorId: principal.userId, action: 'admin.brand_kit_website_domain_updated', entityType: 'BrandKit', entityId: kit.id, metadata: { websiteUrl: parsed.data.websiteUrl } });
  revalidatePath('/', 'layout');
  return { success: 'Website domain updated — takes effect on the next page load.' };
}

const defaultCtaSchema = z.object({
  label: z.string().trim().min(1, 'Label is required.'),
  url: z.string().trim().min(1, 'URL is required.'),
});

export async function updateDefaultCta(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = defaultCtaSchema.safeParse({ label: formData.get('label'), url: formData.get('url') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const kit = await getActiveBrandKit();
  await prisma.brandKit.update({ where: { id: kit.id }, data: { defaultCta: toJsonValue(parsed.data) } });
  await recordActivity({ actorId: principal.userId, action: 'admin.brand_kit_default_cta_updated', entityType: 'BrandKit', entityId: kit.id });
  revalidatePath('/admin/brand-kit');
  return { success: 'Default CTA updated.' };
}

const hashtagsSchema = z.object({ hashtags: z.string().trim().optional() });

export async function updateDefaultHashtags(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = hashtagsSchema.safeParse({ hashtags: formData.get('hashtags') || '' });
  if (!parsed.success) return { error: 'Invalid input.' };

  const hashtags = (parsed.data.hashtags ?? '')
    .split(',')
    .map((h) => h.trim().replace(/^#/, ''))
    .filter(Boolean);

  const kit = await getActiveBrandKit();
  await prisma.brandKit.update({ where: { id: kit.id }, data: { defaultHashtags: hashtags } });
  await recordActivity({ actorId: principal.userId, action: 'admin.brand_kit_default_hashtags_updated', entityType: 'BrandKit', entityId: kit.id });
  revalidatePath('/admin/brand-kit');
  return { success: 'Default hashtags updated.' };
}

const voiceSchema = z.object({
  brandVoice: z.string().trim().optional(),
  emailSignature: z.string().trim().optional(),
});

export async function updateBrandVoice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = voiceSchema.safeParse({
    brandVoice: formData.get('brandVoice') || '',
    emailSignature: formData.get('emailSignature') || '',
  });
  if (!parsed.success) return { error: 'Invalid input.' };

  const kit = await getActiveBrandKit();
  await prisma.brandKit.update({
    where: { id: kit.id },
    data: { brandVoice: parsed.data.brandVoice || null, emailSignature: parsed.data.emailSignature || null },
  });
  await recordActivity({ actorId: principal.userId, action: 'admin.brand_kit_voice_updated', entityType: 'BrandKit', entityId: kit.id });
  revalidatePath('/admin/brand-kit');
  return { success: 'Brand voice and email signature updated.' };
}

const footerSettingsSchema = z.object({
  copyrightText: z.string().trim().min(1, 'Required.'),
  showLegalLinks: z.enum(['true', 'false']),
});

export async function updateFooterSettings(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const principal = await requireSession();
  requireRole(principal, SUPER_ADMIN_ONLY);
  const parsed = footerSettingsSchema.safeParse({
    copyrightText: formData.get('copyrightText'),
    showLegalLinks: formData.get('showLegalLinks') ?? 'false',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const kit = await getActiveBrandKit();
  await prisma.brandKit.update({
    where: { id: kit.id },
    data: { footerSettings: toJsonValue({ copyrightText: parsed.data.copyrightText, showLegalLinks: parsed.data.showLegalLinks === 'true' }) },
  });
  await recordActivity({ actorId: principal.userId, action: 'admin.brand_kit_footer_settings_updated', entityType: 'BrandKit', entityId: kit.id });
  revalidatePath('/admin/brand-kit');
  return { success: 'Footer settings updated.' };
}
