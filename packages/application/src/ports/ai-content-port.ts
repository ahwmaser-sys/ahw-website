// Provider-agnostic AI content generation contract. No implementation here
// (that would couple this package to one vendor's SDK) — concrete adapters
// live in apps/public-site/src/lib/portal/ai/*, selected at runtime by
// AISettings.defaultProvider + a credential connected from Settings →
// Integrations (IntegrationConfig), never hardcoded to one provider.
export type AIContentRequest = Readonly<{
  title: string;
  excerpt: string;
  body: string;
  imageDescription?: string;
  // Output language for the generated package — "en" | "ar" | any locale
  // code the connected provider understands. Absent means the provider's
  // own default (English).
  language?: string;
  // Which office this content speaks for — "Global" (undefined/omitted)
  // or a specific office's own name/city/country/CTA, so the generated
  // copy can naturally reference that office rather than reading generic.
  // Populated by the caller (apps/public-site) from the real Office row;
  // this package stays free of any Prisma/DB dependency.
  officeContext?: Readonly<{ displayName: string; city: string; country: string; ctaLabel?: string }>;
}>;

export type AIContentPackage = Readonly<{
  seoTitle: string;
  metaDescription: string;
  altText?: string;
  caption: string;
  hashtags: readonly string[];
  keywords: readonly string[];
  suggestedCta: string;
  marketingSummary: string;
}>;

export type AIImageCandidate = Readonly<{
  assetId: string;
  keywords: readonly string[];
  altText?: string;
}>;

export type AIImageSuggestion = Readonly<{
  assetId: string;
  reason: string;
  score: number;
}>;

export interface AIContentPort {
  // Async because a real implementation's answer depends on a database
  // row (IntegrationConfig.status), not a synchronously-readable env var.
  isConfigured(): Promise<boolean>;
  generateContentPackage(request: AIContentRequest): Promise<AIContentPackage>;
  generateImageTags(imageUrl: string): Promise<readonly string[]>;
  // Ranks a caller-supplied candidate pool (already fetched from the Media
  // Library by the caller) rather than searching a media store itself —
  // keeps this package free of any Prisma/DB dependency.
  suggestImages(request: AIContentRequest, candidates: readonly AIImageCandidate[]): Promise<readonly AIImageSuggestion[]>;
}
