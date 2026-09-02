// Platform-agnostic contract every adapter implements — see
// /PORTAL-PLAN.md §7. A fourth platform later means one new file
// implementing this interface, registered in adapter.ts's list; nothing
// else in the dispatch/queue code changes.
export interface SocialPostSource {
  title: string;
  excerpt: string;
  // The full outbound URL adapters link back to — computed by the
  // caller (dispatch.ts), not built from a bare slug here, since the
  // caller is the only place that knows which content type this post
  // came from (a NewsPost links to /insights/news/{slug}, a
  // PortfolioProject to /projects/{slug}) and therefore which URL shape
  // applies. Keeps every adapter fully content-type-agnostic — none of
  // them need to know that a second content type (portfolio projects)
  // even exists.
  canonicalUrl: string;
  // Public, unauthenticated URL of the post's featured image, when it has
  // one — resolved by dispatch.ts via the public /api/media/[assetId]
  // route (only ever set when that image is genuinely publicly visible).
  // Image-first platforms (Instagram) require this to publish at all.
  imageUrl?: string | undefined;
}

export interface FormattedSocialContent {
  caption: string;
  imageUrl?: string | undefined;
}

export interface PublishResult {
  permalink: string;
}

export interface SocialAdapter {
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'GOOGLE_BUSINESS';
  // True only once Settings → Integrations shows this *office's*
  // connection as CONNECTED (a real access token is stored) — never
  // true in this environment, since no real social credentials exist
  // (Honesty Lock: this is what keeps every post in Manual mode by
  // default). Each office connects its own account, so this always
  // takes the office being dispatched for, never a single global
  // credential.
  isConfigured(officeId: string): Promise<boolean>;
  formatContent(post: SocialPostSource): FormattedSocialContent;
  // Only ever called when isConfigured(officeId) is true. Not exercised
  // in this pass — no adapter has real credentials — but implemented
  // for real so connecting an office's account from Settings →
  // Integrations is a config change, never a code change, per the
  // brief's explicit manual-to-auto switching requirement.
  publish(content: FormattedSocialContent, officeId: string): Promise<PublishResult>;
}
