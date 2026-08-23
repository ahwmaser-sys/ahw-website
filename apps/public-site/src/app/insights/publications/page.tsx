import type { Metadata } from 'next';
import { publications, StructuredData, Breadcrumbs, buildBreadcrumbJsonLd, InsightsFilterBar, PublicationCard } from '@agp/ui-components';
import { getSiteUrl } from '../../../lib/site-config';
import styles from './page.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  return {
    // Plain string: the root layout's title.template already appends
    // "| AHW Architects" — including it here would render doubled.
    title: 'Publications in the Press',
    description: 'Press features and publications covering AHW Architects across regional and international media.',
    alternates: {
      canonical: `${siteUrl}/insights/publications`,
    },
    openGraph: {
      title: 'Publications | AHW Architects in the Press',
      description: 'Press features and publications covering AHW Architects across regional and international media.',
      url: '/insights/publications',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Publications | AHW Architects in the Press',
      description: 'Press features and publications covering AHW Architects across regional and international media.',
    },
  };
}

export default async function PublicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; page?: string }>;
}) {
  const [resolvedSearchParams, siteUrl] = await Promise.all([searchParams, getSiteUrl()]);
  const currentTag = resolvedSearchParams.tag || 'All';
  const currentQuery = (resolvedSearchParams.q || '').toLowerCase();
  
  // Extract unique tags from publications
  const allTags = Array.from(new Set(publications.flatMap(p => p.tags || []))).sort();

  // Filter logic
  const filteredPublications = publications.filter((pub) => {
    const matchesTag = currentTag === 'All' || (pub.tags && pub.tags.includes(currentTag));
    const matchesSearch = 
      pub.title.toLowerCase().includes(currentQuery) || 
      pub.outlet.toLowerCase().includes(currentQuery) ||
      pub.excerpt.toLowerCase().includes(currentQuery);
    return matchesTag && matchesSearch;
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AHW Architects — Publications',
    hasPart: filteredPublications.map((pub) => ({
      '@type': 'NewsArticle',
      headline: pub.title,
      datePublished: pub.date,
      publisher: { '@type': 'Organization', name: pub.outlet },
      url: `${siteUrl}/insights/publications/${pub.slug}`,
    })),
  };

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Insights', href: '/insights' },
    { label: 'Publications' },
  ];

  return (
    <main className={styles.main}>
      <StructuredData data={jsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <Breadcrumbs items={breadcrumbs} />
          <h1 className={styles.title}>Publications</h1>
          <p className={styles.subtitle}>Features and mentions of AHW Architects in regional and international press.</p>
        </div>
      </section>

      <section className={styles.listSection}>
        <div className={styles.container}>
          <InsightsFilterBar categories={allTags} basePath="/insights/publications" />
          
          {filteredPublications.length === 0 ? (
            <p className={styles.empty}>No publications found matching your criteria.</p>
          ) : (
            <div className={styles.grid}>
              {filteredPublications.map((pub, index) => (
                <PublicationCard key={pub.id} publication={pub} priority={index === 0} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
