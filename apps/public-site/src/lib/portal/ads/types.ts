// Shared shape every platform client in this directory (google-ads.ts,
// meta-ads.ts, linkedin-ads.ts, tiktok-ads.ts) normalizes its platform's
// own API response into — so lib/portal/actions/ads.ts's sync logic and
// the Admin UI never need platform-specific branching, only this common
// shape. Real fields only: nothing here is fabricated when a platform
// doesn't return a value (undefined, never a guessed 0).

export interface AdCampaignSnapshot {
  externalCampaignId: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'REMOVED' | 'UNKNOWN';
  campaignType?: string | undefined;
  spend?: number | undefined;
  impressions?: number | undefined;
  clicks?: number | undefined;
  conversions?: number | undefined;
  conversionValue?: number | undefined;
  currency?: string | undefined;
}

export interface ConversionActionSnapshot {
  id: string;
  name: string;
  status: string;
  category?: string | undefined;
}

// Thrown by any client function so callers (ads.ts actions) can surface
// a real, specific platform error in lastSyncError / a Test Connection
// result, instead of a generic "sync failed."
export class AdPlatformApiError extends Error {
  constructor(
    public readonly platform: string,
    message: string
  ) {
    super(message);
    this.name = 'AdPlatformApiError';
  }
}
