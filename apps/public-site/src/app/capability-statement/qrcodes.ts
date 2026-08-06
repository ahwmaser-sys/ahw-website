import { generateQrCodeBuffer } from '../../lib/portal/media/qrcode';
import { getActiveBrandKit } from '../../lib/portal/brand-kit';
import type { BrandQrStyle, BrandLogos } from '../../lib/portal/brand-kit';
import { getAllOffices } from '../../lib/portal/offices';

export interface CapabilityQrCode {
  label: string;
  dataUri: string;
}

// Keyed by office slug (matches the `id` field on the legacy Office
// shape CapabilityStatementContent/print already render from) so each
// office card can look up its own "Get Directions" code.
export interface OfficeQrCode {
  officeId: string;
  dataUri: string;
}

export interface CapabilityStatementQrCodes {
  global: CapabilityQrCode[];
  officeMaps: OfficeQrCode[];
}

// The Capability Statement is one company-wide document, not duplicated
// per office, so its global QR row (Website/LinkedIn/Instagram/GBP) uses
// the headquarters office's own social accounts as the document's public
// identity — Offices is the only place social links live in this app
// (see the Brand Kit → Offices split); there's no separate "company"
// social account to point to instead. Falls back to the first active
// office if none is flagged HQ.
//
// Per-office "Get Directions" codes use each office's own real map
// share link (Office.mapLink) — never a fabricated or shared link, and
// an office with no map link set simply gets no code, same as any other
// unset field on this document.
//
// A link that isn't set is skipped entirely rather than generating a QR
// code to a dead/empty URL.
export async function getCapabilityStatementQrCodes(siteUrl: string): Promise<CapabilityStatementQrCodes> {
  const [kit, offices] = await Promise.all([getActiveBrandKit(), getAllOffices()]);
  const hq = offices.find((o) => o.isHeadquarters) ?? offices[0];

  const style = (kit.qrCodeStyle as unknown as BrandQrStyle | null) ?? { foreground: '#0F1115', background: '#F2F4F7', logoOverlay: false };
  const logos = kit.logos as unknown as BrandLogos | null;
  const logoStorageKey = style.logoOverlay ? (logos?.icon ?? null) : null;

  const social = (hq?.socialLinks as Record<string, string> | null) ?? {};

  const globalCandidates: { label: string; url: string | null | undefined }[] = [
    { label: 'Website', url: siteUrl },
    { label: 'LinkedIn', url: social.linkedin },
    { label: 'Instagram', url: social.instagram },
    { label: 'Google Business Profile', url: hq?.googleBusinessProfileUrl },
  ];
  const globalWithUrl = globalCandidates.filter((c): c is { label: string; url: string } => Boolean(c.url));

  const officeCandidates = offices
    .filter((o) => o.status === 'ACTIVE')
    .map((o) => ({ officeId: o.slug, url: o.mapLink }))
    .filter((c): c is { officeId: string; url: string } => Boolean(c.url));

  const [global, officeMaps] = await Promise.all([
    Promise.all(
      globalWithUrl.map(async ({ label, url }) => {
        const buffer = await generateQrCodeBuffer(url, style, logoStorageKey);
        return { label, dataUri: `data:image/png;base64,${buffer.toString('base64')}` };
      })
    ),
    Promise.all(
      officeCandidates.map(async ({ officeId, url }) => {
        const buffer = await generateQrCodeBuffer(url, style, logoStorageKey);
        return { officeId, dataUri: `data:image/png;base64,${buffer.toString('base64')}` };
      })
    ),
  ]);

  return { global, officeMaps };
}
