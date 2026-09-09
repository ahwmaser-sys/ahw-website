import type { MetadataRoute } from 'next';
import { getSiteUrl } from '../lib/site-config';

// Was a static public/robots.txt with a hand-written Sitemap: line — that
// file drifted out of sync with the canonical domain (Settings → Brand)
// once and stayed wrong for weeks, because nothing tied it to the same
// source of truth every other canonical/OG/JSON-LD URL in this app reads
// from. Same fix pattern as sitemap.ts: read getSiteUrl() at request time
// so this can never point at the wrong domain again.
export const revalidate = 30;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl();
  return {
    rules: {
      userAgent: '*',
      // '/api/media/' is listed explicitly because `Disallow: /api/` was
      // blocking it, and every article cover image is served from there --
      // both the NewsArticle/Article JSON-LD `image` and og:image resolve to
      // https://<site>/api/media/<id>?variant=... So the images loaded fine
      // for visitors and were unfetchable for exactly the clients that need
      // them: Google (no image in rich results), and the LinkedIn/Facebook/X
      // fetchers, which honour robots.txt (no image on a shared link).
      //
      // Google and Bing resolve a conflict between Allow and Disallow by the
      // longest matching path, so the more specific '/api/media/' wins over
      // '/api/'; the rest of the API stays closed.
      allow: ['/', '/api/media/'],
      disallow: ['/api/', '/admin/', '/client/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
