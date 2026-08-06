import { getActiveBrandKit } from './portal/brand-kit';

// The one function every canonical URL / Open Graph tag / QR code /
// generated PDF / email template / CTA link in this app should call
// instead of a literal 'https://ahwspaces.com' — the Website Domain
// (Settings → Brand) is the single source of truth, editable without a
// code change. Never derives or affects the company's legal name (see
// BrandKit.companyInfo.legalName) — a domain and a company identity are
// two independent settings by design.
export async function getSiteUrl(): Promise<string> {
  const kit = await getActiveBrandKit();
  return kit.websiteUrl.replace(/\/+$/, '');
}
