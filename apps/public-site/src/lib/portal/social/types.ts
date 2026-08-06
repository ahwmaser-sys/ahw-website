// Platform-agnostic contract every adapter implements — see
// /PORTAL-PLAN.md §7. A fourth platform later means one new file
// implementing this interface, registered in adapter.ts's list; nothing
// else in the dispatch/queue code changes.
export interface SocialPostSource {
  title: string;
  excerpt: string;
  slug: string;
  // Public, unauthenticated URL of the post's featured image, when it has
  // one — resolved by dispatch.ts via the public /api/media/[assetId]
  // route (only ever set when that image is genuinely publicly visible).
  // Image-first platforms (Instagram) require this to publish at all.
  imageUrl?: string | undefined;
  // The Website Domain (Settings → Brand Kit), resolved once by the
  // caller (dispatch.ts / actions/social.ts, both already async) — every
  // adapter's formatContent builds its outbound link from this, never a
  // hardcoded domain, so changing the domain never requires a code change
  // here despite formatContent itself staying synchronous.
  siteUrl: string;
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

export function canonicalNewsUrl(slug: string, siteUrl: string): string {
  return `${siteUrl}/insights/news/${slug}`;
}
