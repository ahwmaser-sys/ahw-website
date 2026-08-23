import { CapabilityStatementContent } from './CapabilityStatementContent';
import { getActiveOfficesForDisplay } from '../../lib/portal/offices';
import { getSiteUrl } from '../../lib/site-config';
import { getCapabilityStatementQrCodes } from './qrcodes';

// `revalidate = 30` alone (the fix used everywhere else office data is
// rendered) was not enough here — confirmed live via repeated requests:
// x-vercel-cache stayed STALE with a continuously climbing `age`, never
// flipping to a fresh HIT, while functionally identical routes (/about,
// /faq, /expertise) with the same revalidate value updated correctly.
// getCapabilityStatementQrCodes generates several sharp-composited QR
// codes per request (website + up to ~4 per office), which is plausibly
// too slow/heavy to complete inside Vercel's background ISR
// regeneration budget — a live user-facing request has a larger budget
// than a background revalidation does. Forcing this specific, low-
// traffic page (an executive one-pager, not a high-volume route) fully
// dynamic sidesteps that failure mode entirely: same approach already
// proven correct on /contact, at an acceptable cost given how rarely
// this page is actually requested.
export const dynamic = 'force-dynamic';

// A thin Server Component wrapper — the page's actual content (hero,
// lightbox gallery, etc.) needs 'use client' for its interactive state,
// so office data and the QR codes (which need real database + Brand Kit
// access) are fetched here and passed down as props instead.
export default async function CapabilityStatement() {
  const [offices, siteUrl] = await Promise.all([getActiveOfficesForDisplay(), getSiteUrl()]);
  const qrCodes = await getCapabilityStatementQrCodes(siteUrl);
  return <CapabilityStatementContent offices={offices} siteUrl={siteUrl} websiteQr={qrCodes.website} officeQrCodes={qrCodes.byOffice} />;
}
