import type { SocialAdapter, SocialPostSource, FormattedSocialContent, PublishResult } from './types';
import { canonicalNewsUrl } from './types';
import { getIntegrationCredential } from '../integrations/store';
import { fetchGoogleBusinessApi } from '../integrations/google-business-http';

// Google Business Profile API access requires a Google-approved access
// request and a verified Business Profile — restricted significantly
// since 2024, the same category of external, non-code blocker as
// Instagram's Graph API review and LinkedIn's Community Management API
// access (both already true of the other three adapters in this
// directory). Same conclusion: built for real, gated behind a credential
// connected from Settings → Integrations, Manual mode by default.
//
// Scoped to STANDARD ("What's New") posts — the type that maps onto "a
// published article becomes a GBP post." EVENT/OFFER/PRODUCT post types
// need fields (dates, redemption codes) that don't come from a NewsPost
// at all; out of scope here, and PublishingDestination.config exists
// specifically so adding them later doesn't need a schema change.

interface GoogleBusinessCredential {
  accessToken: string;
  locationId: string; // "accounts/{account}/locations/{location}"
}

const API = 'https://mybusiness.googleapis.com/v4';

export const googleBusinessAdapter: SocialAdapter = {
  platform: 'GOOGLE_BUSINESS',

  async isConfigured(officeId: string): Promise<boolean> {
    const cred = await getIntegrationCredential<GoogleBusinessCredential>('GOOGLE_BUSINESS', officeId);
    return Boolean(cred?.accessToken && cred.locationId);
  },

  formatContent(post: SocialPostSource): FormattedSocialContent {
    const link = canonicalNewsUrl(post.slug, post.siteUrl);
    // GBP "What's New" posts favor a concise summary plus a direct link
    // — closer to Facebook/LinkedIn's register than Instagram's
    // hashtag-heavy caption.
    return {
      caption: `${post.title}\n\n${post.excerpt}\n\nRead more: ${link}`,
      imageUrl: post.imageUrl,
    };
  },

  async publish(content: FormattedSocialContent, officeId: string): Promise<PublishResult> {
    const cred = await getIntegrationCredential<GoogleBusinessCredential>('GOOGLE_BUSINESS', officeId);
    if (!cred) {
      throw new Error('Google Business Profile adapter is not configured — this should never be called while isConfigured() is false.');
    }

    // A 429 here unambiguously means Google rejected the request before
    // any server-side effect (no post was created) — safe for the
    // shared retry wrapper to reissue the same POST body.
    const res = await fetchGoogleBusinessApi(`${API}/${cred.locationId}/localPosts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cred.accessToken}`,
      },
      body: JSON.stringify({
        languageCode: 'en',
        summary: content.caption,
        topicType: 'STANDARD',
        ...(content.imageUrl ? { media: [{ mediaFormat: 'PHOTO', sourceUrl: content.imageUrl }] } : {}),
      }),
    });
    const body: unknown = await res.json();
    if (!res.ok || typeof body !== 'object' || body === null) {
      throw new Error(`Google Business Profile post failed: ${JSON.stringify(body)}`);
    }
    const name = (body as { name?: string; searchUrl?: string }).name;
    const searchUrl = (body as { searchUrl?: string }).searchUrl;
    if (!name && !searchUrl) {
      throw new Error(`Google Business Profile post returned no identifier: ${JSON.stringify(body)}`);
    }

    return { permalink: searchUrl ?? `https://business.google.com/posts/${name}` };
  },
};
