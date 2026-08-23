import { CapabilityStatementContent } from './CapabilityStatementContent';
import { getActiveOfficesForDisplay } from '../../lib/portal/offices';
import { getSiteUrl } from '../../lib/site-config';
import { getCapabilityStatementQrCodes } from './qrcodes';

// Without this, Next.js has no reason to treat this page as dynamic (no
// cookies()/searchParams/headers() usage) and statically bakes office
// data — including phone numbers — in at build time. Confirmed live: an
// Admin office edit propagated to every other office-data consumer
// (homepage, /contact, footer) but never reached this page, even
// minutes later, until a fresh deployment. Same fix, same reasoning as
// app/page.tsx's own revalidate.
export const revalidate = 30;

// A thin Server Component wrapper — the page's actual content (hero,
// lightbox gallery, etc.) needs 'use client' for its interactive state,
// so office data and the QR codes (which need real database + Brand Kit
// access) are fetched here and passed down as props instead.
export default async function CapabilityStatement() {
  const [offices, siteUrl] = await Promise.all([getActiveOfficesForDisplay(), getSiteUrl()]);
  const qrCodes = await getCapabilityStatementQrCodes(siteUrl);
  return <CapabilityStatementContent offices={offices} siteUrl={siteUrl} websiteQr={qrCodes.website} officeQrCodes={qrCodes.byOffice} />;
}
