import { cache } from 'react';
import type { Prisma } from '@prisma/client';
import { prisma } from './db';

// Prisma's Json columns require InputJsonValue, which needs a string index
// signature — these interfaces are plain data shapes without one, so this
// helper does the (safe, since every field here really is JSON-serializable)
// cast in one place rather than scattering `as unknown as Prisma.InputJsonValue`
// through every call site.
// A real transform, not just a type-level cast: round-tripping through
// JSON strips anything (undefined values, non-plain-object shapes) that
// wouldn't survive being stored as JSON anyway, so the result genuinely
// satisfies Prisma's InputJsonValue rather than just being asserted to.
export function toJsonValue<T extends object>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export interface BrandColors {
  ink: string;
  paper: string;
  stone: string;
  accentDark: string;
  accentLight: string;
}

export interface BrandTypography {
  primaryFont: string;
  secondaryFont: string;
  weightLight: number;
  weightRegular: number;
  weightMedium: number;
}

export interface CtaStyle {
  label: string;
  background: string;
  foreground: string;
}

export interface BrandLogos {
  light: string | null;
  dark: string | null;
  icon: string | null;
}

export interface BrandWatermark {
  assetId: string;
  opacity: number;
  position: string;
}

export interface BrandQrStyle {
  foreground: string;
  background: string;
  logoOverlay: boolean;
}

// Global Company identity — distinct from any one Office (see
// lib/portal/offices.ts). legalName is the one true legal name; nothing
// in this app is allowed to derive it from websiteUrl or vice versa.
export interface BrandCompanyInfo {
  legalName: string;
  tagline: string;
  founded: string;
}

export interface BrandDefaultCta {
  label: string;
  url: string;
}

export interface BrandFooterSettings {
  copyrightText: string;
  showLegalLinks: boolean;
}

// Seeded from the real values in packages/design-tokens/src/styles/tokens.css
// — the same deep monochromatic palette the public site already uses, kept
// in sync by hand (Satori/the template engine can't read CSS custom
// properties, see lib/content-studio/template-engine's own notes). This is
// the *default* the Brand Kit starts from, not a hardcoded value templates
// read directly — every consumer reads getActiveBrandKit(), not this
// constant.
const DEFAULT_COLORS: BrandColors = {
  ink: '#0F1115',
  paper: '#F2F4F7',
  stone: '#8B929A',
  accentDark: '#FFFFFF',
  accentLight: '#000000',
};

const DEFAULT_TYPOGRAPHY: BrandTypography = {
  primaryFont: 'Inter',
  secondaryFont: 'Outfit',
  weightLight: 300,
  weightRegular: 400,
  weightMedium: 500,
};

const DEFAULT_CTA_STYLES: Record<string, CtaStyle> = {
  default: { label: 'Learn More', background: '#FFFFFF', foreground: '#0F1115' },
  secondary: { label: 'View Project', background: 'transparent', foreground: '#FFFFFF' },
};

const DEFAULT_COMPANY_INFO: BrandCompanyInfo = {
  legalName: 'AHW Architects Masr',
  tagline: 'Luxury Architecture & Interior Design',
  founded: '2012',
};

const DEFAULT_FOOTER_SETTINGS: BrandFooterSettings = {
  copyrightText: `© ${new Date().getFullYear()} AHW Architects. All rights reserved.`,
  showLegalLinks: true,
};

// Lazily creates the one active BrandKit row on first read, seeded from
// real data (design tokens for colors/typography), so every consumer
// (template engine, QR generator, future features) has something real to
// read from day one without requiring a manual setup step first.
// Company/contact/social data that used to live here moved to the
// Offices module (lib/portal/offices.ts) — Brand Kit is Global Company
// only now, never a second, competing source of per-office contact info.
//
// Wrapped in React's cache() — this now gets called from the root
// layout on every request (for websiteUrl/legalName/footer copy) as
// well as by whichever individual page also needs it for its own
// metadata; cache() collapses all of those into one query per request
// instead of one per call site, which matters on this app's small local
// connection pool (see lib/portal/db.ts's own history of connection-
// exhaustion bugs).
export const getActiveBrandKit = cache(async () => {
  const existing = await prisma.brandKit.findFirst({ where: { isActive: true } });
  if (existing) {
    // Backfill for a BrandKit row created before this go-live pass added
    // these columns — without this, a row from an earlier session (this
    // one's local dev database included) would have companyInfo sitting
    // at its Prisma-default null forever, since the create() path below
    // only ever runs once per install. Self-heals once, here, rather
    // than needing a separate migration script.
    if (existing.companyInfo === null) {
      return prisma.brandKit.update({
        where: { id: existing.id },
        data: {
          companyInfo: toJsonValue(DEFAULT_COMPANY_INFO),
          defaultCta: toJsonValue({ label: 'Start Your Project', url: `${existing.websiteUrl}/contact` }),
          defaultHashtags: existing.defaultHashtags.length > 0 ? existing.defaultHashtags : ['AHWArchitects', 'Architecture', 'InteriorDesign'],
          footerSettings: toJsonValue(DEFAULT_FOOTER_SETTINGS),
        },
      });
    }
    return existing;
  }

  return prisma.brandKit.create({
    data: {
      name: 'AHW Architects',
      colors: toJsonValue(DEFAULT_COLORS),
      typography: toJsonValue(DEFAULT_TYPOGRAPHY),
      ctaStyles: toJsonValue(DEFAULT_CTA_STYLES),
      logos: { light: null, dark: null, icon: null },
      websiteUrl: 'https://ahwspaces.com',
      isActive: true,
      companyInfo: toJsonValue(DEFAULT_COMPANY_INFO),
      defaultCta: toJsonValue({ label: 'Start Your Project', url: 'https://ahwspaces.com/contact' }),
      defaultHashtags: ['AHWArchitects', 'Architecture', 'InteriorDesign'],
      footerSettings: toJsonValue(DEFAULT_FOOTER_SETTINGS),
    },
  });
});
