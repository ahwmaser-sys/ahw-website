import { CapabilityStatementContent } from './CapabilityStatementContent';
import { getActiveOfficesForDisplay } from '../../lib/portal/offices';
import { getSiteUrl } from '../../lib/site-config';
import { getCapabilityStatementQrCodes } from './qrcodes';

// A thin Server Component wrapper — the page's actual content (hero,
// lightbox gallery, etc.) needs 'use client' for its interactive state,
// so office data and the QR codes (which need real database + Brand Kit
// access) are fetched here and passed down as props instead.
export default async function CapabilityStatement() {
  const [offices, siteUrl] = await Promise.all([getActiveOfficesForDisplay(), getSiteUrl()]);
  const qrCodes = await getCapabilityStatementQrCodes(siteUrl);
  return <CapabilityStatementContent offices={offices} siteUrl={siteUrl} websiteQr={qrCodes.website} officeQrCodes={qrCodes.byOffice} />;
}
