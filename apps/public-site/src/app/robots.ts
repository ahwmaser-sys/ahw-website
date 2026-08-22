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
      allow: '/',
      disallow: ['/api/', '/admin/', '/client/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
