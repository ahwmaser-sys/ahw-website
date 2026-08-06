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
// office card can look up its own codes.
export interface OfficeQrCodes {
  officeId: string;
  codes: CapabilityQrCode[];
}

export interface CapabilityStatementQrCodes {
  // The one company-wide code — a single website, so this one alone
  // stays global rather than duplicated per office.
  website: CapabilityQrCode | null;
  byOffice: OfficeQrCodes[];
}

// Social accounts are genuinely per-office, not one shared company
// identity — Egypt and Kuwait each run their own LinkedIn/Instagram
// (confirmed real, distinct handles in the Office data, e.g.
// instagram.com/ahw_masr vs instagram.com/ahw_architects). An earlier
// version of this file used only the headquarters office's social
// links for one shared QR row, which silently hid the other office's
// real accounts — every office now gets its own Get Directions/
// LinkedIn/Instagram/Google Business Profile codes, sourced from that
// office's own row, never borrowed from another office or invented.
//
// A link that isn't set is skipped entirely rather than generating a
// QR code to a dead/empty URL.
export async function getCapabilityStatementQrCodes(siteUrl: string): Promise<CapabilityStatementQrCodes> {
  const [kit, offices] = await Promise.all([getActiveBrandKit(), getAllOffices()]);

  const style = (kit.qrCodeStyle as unknown as BrandQrStyle | null) ?? { foreground: '#0F1115', background: '#F2F4F7', logoOverlay: false };
  const logos = kit.logos as unknown as BrandLogos | null;
  const logoStorageKey = style.logoOverlay ? (logos?.icon ?? null) : null;

  async function makeCode(label: string, url: string): Promise<CapabilityQrCode> {
    const buffer = await generateQrCodeBuffer(url, style, logoStorageKey);
    return { label, dataUri: `data:image/png;base64,${buffer.toString('base64')}` };
  }

  const [website, byOffice] = await Promise.all([
    makeCode('Website', siteUrl),
    Promise.all(
      offices
        .filter((o) => o.status === 'ACTIVE')
        .map(async (o) => {
          const social = (o.socialLinks as Record<string, string> | null) ?? {};
          const candidates: { label: string; url: string | null | undefined }[] = [
            { label: 'Get Directions', url: o.mapLink },
            { label: 'LinkedIn', url: social.linkedin },
            { label: 'Instagram', url: social.instagram },
            { label: 'Google Business Profile', url: o.googleBusinessProfileUrl },
          ];
          const withUrl = candidates.filter((c): c is { label: string; url: string } => Boolean(c.url));
          const codes = await Promise.all(withUrl.map((c) => makeCode(c.label, c.url)));
          return { officeId: o.slug, codes };
        })
    ),
  ]);

  return { website, byOffice };
}
