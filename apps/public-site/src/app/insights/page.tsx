import type { Metadata } from 'next';
import Link from 'next/link';
import { publications, PublicationCard, NewsCard, Breadcrumbs, StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getPublicNewsItems } from '../../lib/portal/public-news';
import { getSiteUrl } from '../../lib/site-config';
import styles from './page.module.css';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Insights' },
];

// Otherwise Next prerenders this once at build time and a freshly
// published NewsPost wouldn't show until the next deploy — same ISR
// window as the homepage (page.tsx) rather than fully dynamic, to keep
// most of the static-rendering performance benefit.
export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  return {
    title: 'Insights',
    description: 'A hub for publications, press features, and company news from AHW Architects.',
    alternates: {
      canonical: `${siteUrl}/insights`,
      types: {
        'application/rss+xml': `${siteUrl}/insights/feed.xml`,
      },
    },
    openGraph: {
      title: 'Insights',
      description: 'A hub for publications, press features, and company news from AHW Architects.',
      url: '/insights',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Insights',
      description: 'A hub for publications, press features, and company news from AHW Architects.',
    },
  };
}

export default async function InsightsPage() {
  const newsItems = await getPublicNewsItems();
  const featuredPublication = publications.find(p => p.isFeatured) || publications[0];
  const featuredNews = newsItems.find(n => n.isFeatured) || newsItems[0];

  return (
    <main className={styles.main}>
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <Breadcrumbs items={breadcrumbs} />
          <h1 className={styles.title}>Insights</h1>
          <p className={styles.subtitle}>Explore our latest architectural publications, press features, and company news.</p>
          <a href="/insights/feed.xml" className={styles.viewAll}>RSS Feed →</a>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.container}>
          <div className={styles.splitLayout}>
            {/* Publications Column */}
            <div className={styles.column}>
              <div className={styles.columnHeader}>
                <h2 className={styles.columnTitle}>Publications</h2>
                <Link href="/insights/publications" className={styles.viewAll}>View All</Link>
              </div>
              {featuredPublication && (
                <PublicationCard publication={featuredPublication} featured priority />
              )}
            </div>

            {/* News Column */}
            <div className={styles.column}>
              <div className={styles.columnHeader}>
                <h2 className={styles.columnTitle}>Company News</h2>
                <Link href="/insights/news" className={styles.viewAll}>View All</Link>
              </div>
              {featuredNews && (
                <NewsCard news={featuredNews} />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
