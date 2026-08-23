import { NextResponse } from 'next/server';
import { getActiveOfficesForDisplay } from '../../../../lib/portal/offices';
import { getSiteUrl } from '../../../../lib/site-config';
import { getCapabilityStatementQrCodes } from '../../../capability-statement/qrcodes';

// TEMPORARY diagnostic route — not linked from anywhere, no public
// purpose. Isolates whether capability-statement's data-fetching
// (office data + QR generation) is what fails/times out under dynamic
// rendering, separate from its React rendering. Read-only, no side
// effects. Removed once the real capability-statement bug is found.
export async function GET() {
  const timings: Record<string, number> = {};
  const t0 = Date.now();
  try {
    const [offices, siteUrl] = await Promise.all([getActiveOfficesForDisplay(), getSiteUrl()]);
    timings.officesAndSiteUrl = Date.now() - t0;

    const t1 = Date.now();
    const qrCodes = await getCapabilityStatementQrCodes(siteUrl);
    timings.qrCodes = Date.now() - t1;

    return NextResponse.json({
      ok: true,
      totalMs: Date.now() - t0,
      timings,
      officeCount: offices.length,
      websiteQrPresent: Boolean(qrCodes.website),
      officeQrCounts: qrCodes.byOffice.map((o) => ({ officeId: o.officeId, count: o.codes.length })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        totalMs: Date.now() - t0,
        timings,
        error: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : String(error),
      },
      { status: 500 }
    );
  }
}
