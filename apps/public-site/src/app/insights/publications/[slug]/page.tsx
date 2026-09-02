import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { publications, StructuredData, Breadcrumbs, buildBreadcrumbJsonLd, SocialShare, CategoryPills, ArticlePrevNext } from '@agp/ui-components';
import { getSiteUrl } from '../../../../lib/site-config';
import { getPublicPortfolioProjects } from '../../../../lib/portfolio';
import styles from './page.module.css';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const pub = publications.find((p) => p.slug === resolvedParams.slug);

  if (!pub) {
    return { title: 'Not Found' };
  }

  const siteUrl = await getSiteUrl();

  return {
    // Plain string: the root layout's title.template already appends
    // "| AHW Architects" — including it here would render doubled.
    title: pub.title,
    description: pub.excerpt,
    alternates: {
      canonical: `${siteUrl}/insights/publications/${pub.slug}`,
    },
    openGraph: {
      title: pub.title,
      description: pub.excerpt,
      url: `${siteUrl}/insights/publications/${pub.slug}`,
      images: pub.coverImage ? [pub.coverImage] : [],
    },
  };
}

export default async function PublicationDetailPage({ params }: Props) {
  const [resolvedParams, siteUrl] = await Promise.all([params, getSiteUrl()]);
  const pub = publications.find((p) => p.slug === resolvedParams.slug);

  if (!pub) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: pub.title,
    image: pub.coverImage ? [pub.coverImage] : [],
    datePublished: pub.date,
    author: {
      '@type': 'Organization',
      name: pub.outlet,
    },
    // @id merges this into the same canonical Organization node every
    // other page anchors to (layout.tsx) rather than declaring a fresh,
    // disconnected "AHW Architects" each time.
    publisher: {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'AHW Architects',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/ahw-brand-icon.png`,
        width: 512,
        height: 512,
      },
    },
    description: pub.excerpt,
  };

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Insights', href: '/insights' },
    { label: 'Publications', href: '/insights/publications' },
    { label: pub.title },
  ];

  // Resolve related projects
  const portfolioProjects = await getPublicPortfolioProjects();
  const relatedProjects = (pub.relatedProjectSlugs ?? [])
    .map((slug) => portfolioProjects.find((p) => p.slug === slug))
    .filter((p): p is typeof portfolioProjects[number] => Boolean(p));

  // Sorted by date rather than raw declaration order, so prev/next stays
  // correct as more entries are hand-added to this static array later —
  // same findIndex-on-ordered-list pattern as News/Projects, no
  // wraparound at the ends.
  const orderedPublications = [...publications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const orderedIndex = orderedPublications.findIndex((p) => p.slug === pub.slug);
  const prevPub = orderedIndex > 0 ? orderedPublications[orderedIndex - 1] : null;
  const nextPub = orderedIndex < orderedPublications.length - 1 ? orderedPublications[orderedIndex + 1] : null;

  return (
    <main className={styles.main}>
      <StructuredData data={jsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />

      <article className={styles.article}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.container}>
            <Breadcrumbs items={breadcrumbs} />
            <CategoryPills items={pub.tags ?? []} />
            <h1 className={styles.title}>{pub.title}</h1>
            {pub.excerpt && <p className={styles.excerpt}>{pub.excerpt}</p>}
            <div className={styles.bylineRow}>
              <div className={styles.meta}>
                <span className={styles.outlet}>{pub.outlet}</span>
                <span className={styles.separator}>—</span>
                <time dateTime={pub.date} className={styles.date}>
                  {new Date(pub.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                {pub.readingTime && (
                  <>
                    <span className={styles.separator}>—</span>
                    <span className={styles.readingTime}>{pub.readingTime}</span>
                  </>
                )}
              </div>
              <SocialShare url={`${siteUrl}/insights/publications/${pub.slug}`} title={pub.title} />
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {pub.coverImage && (
          <div className={styles.coverBlock}>
            <div className={styles.coverImageWrapper}>
              <Image
                src={pub.coverImage}
                alt={pub.title}
                fill
                sizes="(min-width: 800px) 800px, 100vw"
                className={styles.coverImage}
                priority
                fetchPriority="high"
              />
            </div>
            {pub.coverImageCaption && (
              <div className={styles.container}>
                <p className={styles.coverCaption}><em>{pub.coverImageCaption}</em></p>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className={styles.container}>
          <div className={styles.contentWrapper}>
            <div className={styles.content}>
              {pub.content ? (
                <p className={styles.textContent}>{pub.content}</p>
              ) : (
                <p className={styles.textContent}>{pub.excerpt}</p>
              )}
            </div>

            <div className={styles.actions}>
              {pub.url && (
                <a href={pub.url} target="_blank" rel="noopener noreferrer" className={styles.readOriginalButton}>
                  Read Original Feature
                </a>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Relational Content */}
      {relatedProjects.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.container}>
            <h2 className={styles.relatedTitle}>Featured in this Publication</h2>
            <div className={styles.relatedGrid}>
              {relatedProjects.map((relatedProject) => (
                relatedProject.heroImage && (
                  <Link key={relatedProject.slug} href={`/projects/${relatedProject.slug}`} style={{textDecoration: 'none'}}>
                    <div style={{position: 'relative', aspectRatio: '16/9', overflow: 'hidden', marginBottom: '1rem'}}>
                      <Image
                        src={relatedProject.heroImage}
                        alt={relatedProject.title}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        style={{objectFit: 'cover'}}
                        loading="lazy"
                      />
                    </div>
                    <h3 className={styles.relatedSubTitle}>{relatedProject.city}, {relatedProject.market}</h3>
                    <h4 style={{fontFamily: 'var(--font-family-secondary)', fontSize: '1.5rem', fontWeight: 'normal', color: 'var(--color-brand-paper)', margin: 0}}>{relatedProject.title}</h4>
                  </Link>
                )
              ))}
            </div>
          </div>
        </section>
      )}

      <ArticlePrevNext
        prev={prevPub ? { href: `/insights/publications/${prevPub.slug}`, title: prevPub.title } : null}
        next={nextPub ? { href: `/insights/publications/${nextPub.slug}`, title: nextPub.title } : null}
      />
    </main>
  );
}
