import { cache } from 'react';
import type { Office as LegacyOfficeShape } from '@agp/ui-components';
import type { Office as PrismaOffice } from '@prisma/client';
import { prisma } from './db';

// The database is the single source of truth for offices — unlimited,
// admin-creatable, never assumed to be exactly Egypt and Kuwait. This
// module is the one place that reads the Office table and the one place
// that adapts a Prisma row into the shape packages/ui-components'
// presentational components expect (mapToLegacyShape), so a UI-library
// component never needs to know about Prisma.
//
// getActiveOffices/getActiveOfficesForDisplay are wrapped in React's
// cache() for the same reason getActiveBrandKit() is — the root layout
// and individual pages both call these per request, and this app's
// local database connection pool is deliberately small (see
// lib/portal/db.ts).

export const getActiveOffices = cache(async () => {
  return prisma.office.findMany({ where: { status: 'ACTIVE' }, orderBy: { sortOrder: 'asc' } });
});

export async function getAllOffices() {
  return prisma.office.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
}

export async function getOfficeBySlug(slug: string) {
  return prisma.office.findUnique({ where: { slug } });
}

export async function getOfficeById(id: string) {
  return prisma.office.findUnique({ where: { id } });
}

interface OfficeSocialLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  whatsapp?: string;
  bookingUrl?: string;
}

export function officeSocialLinks(office: PrismaOffice): OfficeSocialLinks {
  return (office.socialLinks as OfficeSocialLinks | null) ?? {};
}

// Adapts a real Office row to the shape Header/Footer/FooterSocialLinks/
// WhatsAppFloatingButton/getContactHubActions already expect — those
// components' internals are untouched by the move to a database; only
// where their data comes from changed. `id` intentionally carries the
// office's slug (not its cuid), preserving the exact stable keys
// ('kuwait', 'egypt') those components historically matched against.
export function toLegacyOfficeShape(office: PrismaOffice): LegacyOfficeShape {
  const social = officeSocialLinks(office);
  return {
    id: office.slug,
    name: office.name,
    displayName: office.displayName,
    country: office.country,
    isHeadquarters: office.isHeadquarters,
    address: {
      full: office.addressFull,
      street: office.addressStreet ?? '',
      building: office.addressBuilding ?? '',
      city: office.city,
      ...(office.postalCode ? { postalCode: office.postalCode } : {}),
      mapLink: office.mapLink ?? '',
      embedUrl: office.mapEmbedUrl ?? '',
    },
    contact: {
      primaryEmail: office.emails[0] ?? '',
      generalEmail: office.emails[1] ?? office.emails[0] ?? '',
      phones: office.phones,
      ...(social.whatsapp ? { whatsapp: social.whatsapp } : {}),
      ...(social.bookingUrl ? { bookingUrl: social.bookingUrl } : {}),
      ...(social.instagram ? { instagram: social.instagram } : {}),
      ...(social.facebook ? { facebook: social.facebook } : {}),
      ...(social.linkedin ? { linkedin: social.linkedin } : {}),
    },
    workingHours: office.workingHours ?? '',
    timezone: office.timezone ?? '',
  };
}

export async function getActiveOfficesForDisplay(): Promise<LegacyOfficeShape[]> {
  const offices = await getActiveOffices();
  const displayOffices = offices.map(toLegacyOfficeShape);
  // ahwspaces.com is AHW Architects Masr's public site — the Egypt-facing
  // entity. Every visitor-facing surface reads office order from this one
  // function (Footer, Header/ContactHub, homepage, /contact's default
  // office and its Organization/LocalBusiness structured data, the
  // discipline pages' shared footer), so sorting Egypt first here is a
  // single, shared fix for AI search engines that read DOM/JSON-LD order
  // as an entity-priority signal (confirmed live: Perplexity extracted
  // Kuwait's contact details before Egypt's when asked about AHW).
  // Deliberately independent of the admin-editable sortOrder itself
  // (still Kuwait-first there — see getActiveOffices, unchanged, still
  // used as-is by the admin UI and sitemap.ts) since that field is real
  // business data (Kuwait genuinely is the headquarters), not a
  // presentation choice for this specific Egypt-facing site.
  return [...displayOffices].sort((a, b) => (a.id === 'egypt' ? 0 : 1) - (b.id === 'egypt' ? 0 : 1));
}
