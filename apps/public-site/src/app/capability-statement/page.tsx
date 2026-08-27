import { CapabilityStatementContent } from './CapabilityStatementContent';
import { getActiveOfficesForDisplay } from '../../lib/portal/offices';
import { getSiteUrl } from '../../lib/site-config';
import { getCapabilityStatementQrCodes } from './qrcodes';
import { getActiveBrandKit, getCompanyInfo } from '../../lib/portal/brand-kit';
import { getStatsWithCompanyInfo } from './content';

// REVERTED from `dynamic = 'force-dynamic'` — that made this page 500
// in production. getCapabilityStatementQrCodes (several sharp-
// composited QR codes per request) is too slow to finish inside a
// synchronous request, which ISR's background regeneration was able to
// silently absorb (serving stale content while it failed/timed out in
// the background) but a forced-dynamic render cannot: there's no cached
// fallback to serve when the render itself times out, so it surfaces as
// a hard error instead. Back to revalidate=30, which is the same known
// limitation this page had before this investigation — confirmed real
// (an Admin change here can stay stale for longer than 30s, unlike
// every other office-data consumer) but functional, unlike the
// alternative. The real fix is making QR generation fast/reliable
// enough to render synchronously; that's a separate, deliberate change,
// not a safe one to make speculatively under this task's scope.
export const revalidate = 30;

// A thin Server Component wrapper — the page's actual content (hero,
// lightbox gallery, etc.) needs 'use client' for its interactive state,
// so office data and the QR codes (which need real database + Brand Kit
// access) are fetched here and passed down as props instead.
export default async function CapabilityStatement() {
  const [offices, siteUrl, brandKit] = await Promise.all([getActiveOfficesForDisplay(), getSiteUrl(), getActiveBrandKit()]);
  const qrCodes = await getCapabilityStatementQrCodes(siteUrl);
  const companyInfo = getCompanyInfo(brandKit);
  const stats = getStatsWithCompanyInfo(companyInfo.yearsOfExperience, companyInfo.totalProjects);
  return <CapabilityStatementContent offices={offices} siteUrl={siteUrl} websiteQr={qrCodes.website} officeQrCodes={qrCodes.byOffice} stats={stats} />;
}
