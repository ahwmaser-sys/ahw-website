import { prisma } from '../db';

export interface PageViewInput {
  path: string;
  entityType?: 'Project' | 'NewsPost' | 'LandingPage' | undefined;
  entityId?: string | undefined;
  campaignId?: string | undefined;
  referrer?: string | null | undefined;
  utmSource?: string | null | undefined;
  utmMedium?: string | null | undefined;
  utmCampaign?: string | null | undefined;
}

// Self-hosted content-performance tracking — zero external dependency,
// works immediately (unlike organic-traffic/keyword metrics, which
// genuinely require a real GA4 credential this environment doesn't
// have — see analytics-port.ts). Deliberately fire-and-forget: a
// failed analytics write must never affect the page render it's
// attached to, so this never throws into the caller.
export function recordPageView(input: PageViewInput): void {
  prisma.pageView
    .create({
      data: {
        path: input.path,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        campaignId: input.campaignId ?? null,
        referrer: input.referrer ?? null,
        utmSource: input.utmSource ?? null,
        utmMedium: input.utmMedium ?? null,
        utmCampaign: input.utmCampaign ?? null,
      },
    })
    .catch((error: unknown) => {
      console.error('PageView write failed (non-fatal):', error);
    });
}
