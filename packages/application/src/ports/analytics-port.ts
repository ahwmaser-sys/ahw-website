// External, credential-gated analytics (GA4 Data API / Search Console),
// distinct from the self-hosted PageView tracking built directly into
// apps/public-site (which needs no port — it's a first-party Prisma model).
// This port exists specifically for data this app cannot honestly produce
// without a real external credential: organic traffic, search keywords,
// true social engagement. isConfigured() is false with no implementation
// registered, and the caller must render an explicit "connect" state
// rather than call these methods speculatively — see
// lib/portal/analytics/ga4-port.ts's unconfigured-state implementation.
export type TrafficSummary = Readonly<{
  sessions: number;
  organicSessions: number;
  rangeStart: string;
  rangeEnd: string;
}>;

export type KeywordMetric = Readonly<{
  keyword: string;
  clicks: number;
  impressions: number;
  averagePosition: number;
}>;

export interface AnalyticsPort {
  // Async — a real implementation's answer depends on a database row
  // (IntegrationConfig.status), not a synchronously-readable env var.
  isConfigured(): Promise<boolean>;
  getTrafficSummary(rangeStart: string, rangeEnd: string): Promise<TrafficSummary>;
  getTopKeywords(limit: number): Promise<readonly KeywordMetric[]>;
}
