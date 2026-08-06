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

const API = 'https://api.linkedin.com/v2';

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
    const res = await fetch(`${API}/ugcPosts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cred.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content.caption },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`LinkedIn post failed (${res.status}): ${errorBody}`);
    }
    const postId = res.headers.get('x-restli-id') ?? res.headers.get('x-linkedin-id');
    if (!postId) {
      throw new Error('LinkedIn post succeeded but returned no post id.');
    }

    return { permalink: `https://www.linkedin.com/feed/update/${postId}/` };
  },
};
