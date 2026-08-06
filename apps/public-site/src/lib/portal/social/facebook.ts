import type { SocialAdapter, SocialPostSource, FormattedSocialContent, PublishResult } from './types';
import { canonicalNewsUrl } from './types';
import { getIntegrationCredential } from '../integrations/store';

interface FacebookCredential {
  pageAccessToken: string;
  pageId: string;
}

const GRAPH_API = 'https://graph.facebook.com/v21.0';

export const facebookAdapter: SocialAdapter = {
  platform: 'FACEBOOK',

  async isConfigured(officeId: string): Promise<boolean> {
    const cred = await getIntegrationCredential<FacebookCredential>('FACEBOOK', officeId);
    return Boolean(cred?.pageAccessToken && cred.pageId);
  },

  formatContent(post: SocialPostSource): FormattedSocialContent {
    const link = canonicalNewsUrl(post.slug, post.siteUrl);
    // Facebook favors a direct link-back over "link in bio" workarounds —
    // the platform's own link preview card carries the visual weight.
    return {
      caption: `${post.title}\n\n${post.excerpt}\n\nRead more: ${link}`,
      imageUrl: post.imageUrl,
    };
  },

  async publish(content: FormattedSocialContent, officeId: string): Promise<PublishResult> {
    const cred = await getIntegrationCredential<FacebookCredential>('FACEBOOK', officeId);
    if (!cred) {
      throw new Error('Facebook adapter is not configured — this should never be called while isConfigured() is false.');
    }

    // With an image: /photos (caption becomes the photo's message, and
    // it still appears as a feed post). Without one: plain /feed post.
    const endpoint = content.imageUrl ? `${GRAPH_API}/${cred.pageId}/photos` : `${GRAPH_API}/${cred.pageId}/feed`;
    const body = content.imageUrl
      ? { url: content.imageUrl, caption: content.caption, access_token: cred.pageAccessToken }
      : { message: content.caption, access_token: cred.pageAccessToken };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const responseBody: unknown = await res.json();
    if (!res.ok || typeof responseBody !== 'object' || responseBody === null) {
      throw new Error(`Facebook post failed: ${JSON.stringify(responseBody)}`);
    }
    const postId = (responseBody as { id?: string; post_id?: string }).post_id ?? (responseBody as { id?: string }).id;
    if (!postId) {
      throw new Error(`Facebook post returned no id: ${JSON.stringify(responseBody)}`);
    }

    return { permalink: `https://www.facebook.com/${postId}` };
  },
};
