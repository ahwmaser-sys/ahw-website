import type { MetadataRoute } from 'next';
import { publications } from '@agp/ui-components';
import { getPublicNewsItems } from '../lib/portal/public-news';
import { getActiveOffices } from '../lib/portal/offices';
import { getPublicPortfolioProjects } from '../lib/portfolio';
import { getSiteUrl } from '../lib/site-config';
import { prisma } from '../lib/portal/db';

// Same reasoning as /insights/page.tsx's revalidate: this route would
// otherwise be prerendered once at build time and miss newly published
// NewsPost URLs until the next deploy.
export const revalidate = 30;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [newsItems, offices, baseUrl, projects] = await Promise.all([
    getPublicNewsItems(),
    getActiveOffices(),
    getSiteUrl(),
    getPublicPortfolioProjects(),
  ]);

  // Static marketing pages have no tracked modification date anywhere in
  // the codebase (they're hardcoded components, not DB rows) — omitting
  // `lastModified` rather than stamping every one with the current
  // request time. Re-render time isn't a real edit date, and claiming one
  // every 30s (this route's own revalidate window) trains crawlers to
  // distrust the freshness signal instead of using it to prioritize
  // re-crawls of pages that actually changed.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/expertise`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/expertise/architecture`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/expertise/interior-design`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/expertise/design-build`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/expertise/fit-out`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/expertise/engineering-project-management`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/projects`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/residential`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/insights`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/insights/publications`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/insights/news`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about/about-us`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about/why-ahw`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about/careers`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/faq`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacy-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms-of-service`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/cookie-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/data-deletion`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Offices ARE real DB rows with a genuine Prisma-managed `updatedAt` —
  // using getActiveOffices() (not the display-mapped LegacyOfficeShape,
  // which drops timestamps) specifically to get it. Slug still matches
  // what /contact/[officeId] actually resolves.
  const officeRoutes: MetadataRoute.Sitemap = offices.map((office) => ({
    url: `${baseUrl}/contact/${office.slug}`,
    lastModified: office.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Projects now come from PortfolioProject (via lib/portfolio.ts) —
  // real DB rows do carry a genuine updatedAt, but the shared legacy
  // Project shape this maps into (kept identical to the old static
  // projects.ts type, for every other consumer's sake) doesn't expose
  // it, so this keeps the same no-lastModified behavior as before.
  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
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
