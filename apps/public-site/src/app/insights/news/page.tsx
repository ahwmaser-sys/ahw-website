import type { Metadata } from 'next';
import { StructuredData, Breadcrumbs, InsightsFilterBar, NewsCard } from '@agp/ui-components';
import { getPublicNewsItems } from '../../../lib/portal/public-news';
import { getSiteUrl } from '../../../lib/site-config';
import styles from './page.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  return {
    // Plain string: the root layout's title.template already appends
    // "| AHW Architects" — including it here would render doubled.
    title: 'News',
    description: 'Announcements, updates, and news from AHW Architects.',
    alternates: {
      canonical: `${siteUrl}/insights/news`,
    },
    openGraph: {
      title: 'News | AHW Architects',
      description: 'Announcements, updates, and news from AHW Architects.',
      url: '/insights/news',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'News | AHW Architects',
      description: 'Announcements, updates, and news from AHW Architects.',
    },
  };
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; page?: string }>;
}) {
  const [resolvedSearchParams, newsItems, siteUrl] = await Promise.all([searchParams, getPublicNewsItems(), getSiteUrl()]);
  const currentTag = resolvedSearchParams.tag || 'All';
  const currentQuery = (resolvedSearchParams.q || '').toLowerCase();
  
  // Extract unique tags from news
  const allTags = Array.from(new Set(newsItems.flatMap(n => n.tags || []))).sort();

  // Filter logic
  const filteredNews = newsItems.filter((news) => {
    const matchesTag = currentTag === 'All' || (news.tags && news.tags.includes(currentTag));
    const matchesSearch = 
      news.title.toLowerCase().includes(currentQuery) || 
      news.excerpt.toLowerCase().includes(currentQuery);
    return matchesTag && matchesSearch;
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AHW Architects — News',
    hasPart: filteredNews.map((news) => ({
      '@type': 'NewsArticle',
      headline: news.title,
      datePublished: news.date,
      publisher: { '@type': 'Organization', name: 'AHW Architects' },
      url: `${siteUrl}/insights/news/${news.slug}`,
    })),
  };

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Insights', href: '/insights' },
    { label: 'News' },
  ];

  return (
    <main className={styles.main}>
      <StructuredData data={jsonLd} />
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <Breadcrumbs items={breadcrumbs} />
          <h1 className={styles.title}>Company News</h1>
          <p className={styles.subtitle}>Announcements and updates from AHW Architects.</p>
        </div>
      </section>

      <section className={styles.listSection}>
        <div className={styles.container}>
          <InsightsFilterBar categories={allTags} basePath="/insights/news" />
          
          {filteredNews.length === 0 ? (
            <p className={styles.empty}>No news found matching your criteria.</p>
          ) : (
            <div className={styles.masonryGrid}>
              {filteredNews.map((news) => (
                <NewsCard key={news.id} news={news} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
