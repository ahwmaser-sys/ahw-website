import type { MetadataRoute } from 'next';
import { projects, publications } from '@agp/ui-components';
import { getPublicNewsItems } from '../lib/portal/public-news';
import { getActiveOfficesForDisplay } from '../lib/portal/offices';
import { getSiteUrl } from '../lib/site-config';
import { prisma } from '../lib/portal/db';

// Same reasoning as /insights/page.tsx's revalidate: this route would
// otherwise be prerendered once at build time and miss newly published
// NewsPost URLs until the next deploy.
export const revalidate = 30;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [newsItems, offices, baseUrl] = await Promise.all([getPublicNewsItems(), getActiveOfficesForDisplay(), getSiteUrl()]);
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/expertise`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/expertise/architecture`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/expertise/interior-design`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/expertise/design-build`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/expertise/fit-out`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/projects`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/insights`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/insights/publications`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/insights/news`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about/about-us`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about/why-ahw`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about/careers`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms-of-service`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/cookie-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/data-deletion`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const officeRoutes: MetadataRoute.Sitemap = offices.map((office) => ({
    url: `${baseUrl}/contact/${office.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
    // ogImage is the one guaranteed-populated image field on every project
    // (heroImage/hubFlagshipImage are optional); heroImage adds a second,
    // usually-distinct image when available.
    // encodeURI: several raw asset paths contain literal spaces (e.g.
    // "17-IL bosco VILLA- NEW Cabital/Orignal/..."), which is invalid in an
    // XML <image:loc> entry — encode without touching the `/` separators.
    images: Array.from(new Set([project.ogImage, project.heroImage].filter(Boolean))).map(
      (path) => encodeURI(`${baseUrl}${path}`)
    ),
  }));

  const publicationRoutes: MetadataRoute.Sitemap = publications.map((publication) => ({
    url: `${baseUrl}/insights/publications/${publication.slug}`,
    lastModified: new Date(publication.date),
    changeFrequency: 'yearly',
    priority: 0.5,
  }));

  const newsRoutes: MetadataRoute.Sitemap = newsItems.map((news) => ({
    url: `${baseUrl}/insights/news/${news.slug}`,
    lastModified: new Date(news.date),
    changeFrequency: 'yearly',
    priority: 0.5,
  }));

  const publishedLandingPages = await prisma.landingPage.findMany({ where: { status: 'PUBLISHED' } });
  const landingPageRoutes: MetadataRoute.Sitemap = publishedLandingPages.map((page) => ({
    url: `${baseUrl}/lp/${page.slug}`,
    lastModified: page.publishedAt ?? page.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...officeRoutes, ...projectRoutes, ...publicationRoutes, ...newsRoutes, ...landingPageRoutes];
}
