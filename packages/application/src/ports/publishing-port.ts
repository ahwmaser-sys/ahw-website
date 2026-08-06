// General publishing-destination contract. The concrete social adapters
// (Instagram/Facebook/LinkedIn/Google Business —
// apps/public-site/src/lib/portal/social/*) already implement this exact
// shape via their own local SocialAdapter type, kept independent here
// rather than retrofitted to extend this one, so already-verified working
// code isn't touched. This port exists so a *non-social* future
// destination (a newsletter service, a content-syndication API) has a
// contract to implement without inventing a new pattern, and so the
// PublishingDestination database rows have a stable shape to describe
// regardless of what kind of channel they end up being.
export type PublishableContent = Readonly<{
  title: string;
  body: string;
  canonicalUrl: string;
  imageUrl?: string;
}>;

export type FormattedPublishContent = Readonly<{
  text: string;
  mediaUrls?: readonly string[];
}>;

export type PublishResult = Readonly<{
  permalink: string;
}>;

export interface PublishingPort {
  readonly destinationKey: string;
  // Async, consistent with AIContentPort/AnalyticsPort — a real
  // implementation's answer depends on a database row
  // (IntegrationConfig.status), not a synchronously-readable env var.
  isConfigured(): Promise<boolean>;
  formatContent(content: PublishableContent): FormattedPublishContent;
  publish(content: FormattedPublishContent): Promise<PublishResult>;
}
