import type { SocialAdapter, SocialPostSource, FormattedSocialContent, PublishResult } from './types';
import { canonicalNewsUrl } from './types';
import { getIntegrationCredential } from '../integrations/store';

// Posting to a LinkedIn Organization page requires approved partner
// access (the Community Management API), which is a business
// application process outside this session's control — same category
// of external dependency as Instagram's app review. See
// /PORTAL-PLAN.md §7.

interface LinkedInCredential {
  accessToken: string;
  organizationId: string;
}

const API = 'https://api.linkedin.com/rest';
// LinkedIn's YYYYMM versioned-API scheme — bump periodically per
// LinkedIn's API versioning docs. Kept in sync with the same constant
// in integrations/test.ts.
const LINKEDIN_API_VERSION = '202608';

export const linkedinAdapter: SocialAdapter = {
  platform: 'LINKEDIN',

  async isConfigured(officeId: string): Promise<boolean> {
    const cred = await getIntegrationCredential<LinkedInCredential>('LINKEDIN', officeId);
    return Boolean(cred?.accessToken && cred.organizationId);
  },

  formatContent(post: SocialPostSource): FormattedSocialContent {
    const link = canonicalNewsUrl(post.slug, post.siteUrl);
    // Professional register, no hashtag stuffing — matches how the
    // brief describes LinkedIn's expected tone versus Instagram's.
    return {
      caption: `${post.title}\n\n${post.excerpt}\n\n${link}`,
      imageUrl: post.imageUrl,
    };
  },

  async publish(content: FormattedSocialContent, officeId: string): Promise<PublishResult> {
    const cred = await getIntegrationCredential<LinkedInCredential>('LINKEDIN', officeId);
    if (!cred) {
      throw new Error('LinkedIn adapter is not configured — this should never be called while isConfigured() is false.');
    }

    const author = `urn:li:organization:${cred.organizationId}`;
    // Posts API (replaces the deprecated ugcPosts API) — see
    // https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
    const res = await fetch(`${API}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cred.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Linkedin-Version': LINKEDIN_API_VERSION,
      },
      body: JSON.stringify({
        author,
        commentary: content.caption,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`LinkedIn post failed (${res.status}): ${errorBody}`);
    }
    const postId = res.headers.get('x-restli-id');
    if (!postId) {
      throw new Error('LinkedIn post succeeded but returned no post id.');
    }

    return { permalink: `https://www.linkedin.com/feed/update/${postId}/` };
  },
};
