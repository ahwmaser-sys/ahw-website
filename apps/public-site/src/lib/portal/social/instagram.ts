import type { SocialAdapter, SocialPostSource, FormattedSocialContent, PublishResult } from './types';
import { canonicalNewsUrl } from './types';
import { getIntegrationCredential } from '../integrations/store';

// Instagram Basic Display API was shut down December 2024; the Graph
// API path requires a Business account plus an app review that can take
// 60+ days — real Auto-mode publishing depends on the site owner
// completing that review and connecting the account from Settings →
// Integrations, not on anything this code can do. See /PORTAL-PLAN.md §7.

interface InstagramCredential {
  accessToken: string;
  businessAccountId: string;
}

const GRAPH_API = 'https://graph.facebook.com/v21.0';

export const instagramAdapter: SocialAdapter = {
  platform: 'INSTAGRAM',

  async isConfigured(officeId: string): Promise<boolean> {
    const cred = await getIntegrationCredential<InstagramCredential>('INSTAGRAM', officeId);
    return Boolean(cred?.accessToken && cred.businessAccountId);
  },

  formatContent(post: SocialPostSource): FormattedSocialContent {
    const link = canonicalNewsUrl(post.slug, post.siteUrl);
    return {
      caption: `${post.title}\n\n${post.excerpt}\n\nLink in bio: ${link}\n\n#Architecture #InteriorDesign #AHWArchitects #Design`,
      imageUrl: post.imageUrl,
    };
  },

  // Real Graph API two-step publish: create a media container, then
  // publish it. Instagram has no text-only post type — this rejects
  // clearly if no image is available rather than silently dropping it.
  async publish(content: FormattedSocialContent, officeId: string): Promise<PublishResult> {
    const cred = await getIntegrationCredential<InstagramCredential>('INSTAGRAM', officeId);
    if (!cred) {
      throw new Error('Instagram adapter is not configured — this should never be called while isConfigured() is false.');
    }
    if (!content.imageUrl) {
      throw new Error('Instagram requires an image — this post has none to publish.');
    }

    const createRes = await fetch(`${GRAPH_API}/${cred.businessAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: content.imageUrl,
        caption: content.caption,
        access_token: cred.accessToken,
      }),
    });
    const createBody: unknown = await createRes.json();
    if (!createRes.ok || typeof createBody !== 'object' || createBody === null || !('id' in createBody)) {
      throw new Error(`Instagram media container creation failed: ${JSON.stringify(createBody)}`);
    }
    const containerId = (createBody as { id: string }).id;

    const publishRes = await fetch(`${GRAPH_API}/${cred.businessAccountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: containerId, access_token: cred.accessToken }),
    });
    const publishBody: unknown = await publishRes.json();
    if (!publishRes.ok || typeof publishBody !== 'object' || publishBody === null || !('id' in publishBody)) {
      throw new Error(`Instagram media publish failed: ${JSON.stringify(publishBody)}`);
    }
    const mediaId = (publishBody as { id: string }).id;

    return { permalink: `https://www.instagram.com/p/${mediaId}/` };
  },
};
