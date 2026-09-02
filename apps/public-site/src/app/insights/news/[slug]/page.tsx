import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  StructuredData,
  Breadcrumbs,
  buildBreadcrumbJsonLd,
  PublicationCard,
  SocialShare,
  ScrollReveal,
  CategoryPills,
  ArticleByline,
  ArticlePrevNext,
} from '@agp/ui-components';
import { getPublicNewsItems } from '../../../../lib/portal/public-news';
import { recordPageView } from '../../../../lib/portal/analytics/track';
import { getSiteUrl } from '../../../../lib/site-config';
import { getPublicPortfolioProjects } from '../../../../lib/portfolio';
import { getPublicPublications } from '../../../../lib/publications';
import { renderArticleBody, parseTiptapDoc, renderDocBody } from '../../../../components/article/ArticleBodyRenderer';
import styles from './page.module.css';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [resolvedParams, newsItems, siteUrl] = await Promise.all([params, getPublicNewsItems(), getSiteUrl()]);
  const news = newsItems.find((n) => n.slug === resolvedParams.slug);

  if (!news) {
    return { title: 'Not Found' };
  }

  return {
    // Plain string: the root layout's title.template already appends
    // "| AHW Architects" — including it here would render doubled.
    title: news.title,
    description: news.excerpt,
    alternates: {
      canonical: `${siteUrl}/insights/news/${news.slug}`,
    },
    openGraph: {
      title: news.title,
      description: news.excerpt,
      url: `${siteUrl}/insights/news/${news.slug}`,
      images: news.coverImage ? [news.coverImage] : [],
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const [resolvedParams, newsItems, siteUrl] = await Promise.all([params, getPublicNewsItems(), getSiteUrl()]);
  const news = newsItems.find((n) => n.slug === resolvedParams.slug);

  if (!news) {
    notFound();
  }

  // Content-performance tracking (Marketing Studio analytics) —
  // entityId is the slug (stable across both the static newsItems array
  // and DB-backed NewsPost rows), fire-and-forget, never blocks render.
  recordPageView({ path: `/insights/news/${news.slug}`, entityType: 'NewsPost', entityId: news.slug });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: news.title,
    image: news.coverImage ? [news.coverImage] : [],
    datePublished: news.date,
    // Real author attribution — Google/AI answer engines weight this as
    // an E-E-A-T signal. Omitted entirely (not a fabricated "AHW
    // Architects" placeholder) on the rare item with no author data.
    ...(news.author
      ? {
          author: {
            '@type': 'Person',
            name: news.author.name,
            ...(news.author.jobTitle ? { jobTitle: news.author.jobTitle } : {}),
          },
        }
      : {}),
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
    description: news.excerpt,
  };

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Insights', href: '/insights' },
    { label: 'News', href: '/insights/news' },
    { label: news.title },
  ];

  // Resolve related content
  const [portfolioProjects, publications] = await Promise.all([getPublicPortfolioProjects(), getPublicPublications()]);
  const relatedProjects = (news.relatedProjectSlugs ?? [])
    .map((slug) => portfolioProjects.find((p) => p.slug === slug))
    .filter((p): p is typeof portfolioProjects[number] => Boolean(p));

  const relatedPublication = news.relatedPublicationId
    ? publications.find(p => p.id === news.relatedPublicationId)
    : null;

  // newsItems is already date-sorted newest-first (see
  // getPublicNewsItems()'s own final sort) — same findIndex-on-ordered-
  // list pattern already proven on /projects/[slug], no wraparound at
  // the ends.
  const orderedIndex = newsItems.findIndex((n) => n.slug === news.slug);
  const prevNews = orderedIndex > 0 ? newsItems[orderedIndex - 1] : null;
  const nextNews = orderedIndex < newsItems.length - 1 ? newsItems[orderedIndex + 1] : null;

  return (
    <main className={styles.main}>
      <StructuredData data={jsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />

      <article className={styles.article}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.container}>
            <Breadcrumbs items={breadcrumbs} />
            <CategoryPills items={news.categories?.map((c) => c.name) ?? []} basePath="/insights/news" paramName="category" />
            <h1 className={styles.title}>{news.title}</h1>
            {news.excerpt && <p className={styles.excerpt}>{news.excerpt}</p>}
            <div className={styles.bylineRow}>
              <ArticleByline
                {...(news.author ? { author: news.author } : {})}
                date={news.date}
                {...(news.readingTime ? { readingTime: news.readingTime } : {})}
              />
              <SocialShare url={`${siteUrl}/insights/news/${news.slug}`} title={news.title} />
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {news.coverImage && (
          <ScrollReveal direction="none" duration={0.8}>
            <div className={styles.coverBlock}>
              <div className={styles.coverImageWrapper}>
                <Image
                  src={news.coverImage}
                  alt={news.title}
                  fill
                  sizes="(min-width: 800px) 800px, 100vw"
                  className={styles.coverImage}
                  priority
                  fetchPriority="high"
                />
              </div>
              {news.coverImageCaption && (
                <div className={styles.container}>
                  <p className={styles.coverCaption}><em>{news.coverImageCaption}</em></p>
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Content */}
        <div className={styles.container}>
          <div className={styles.contentWrapper}>
            <div className={styles.content}>
              {(() => {
                const doc = parseTiptapDoc(news.content ?? '');
                return doc
                  ? renderDocBody(doc, news.title, styles)
                  : renderArticleBody(news.content || news.excerpt, news.galleryImages ?? [], styles);
              })()}
            </div>
          </div>
        </div>
      </article>

      {/* Relational Content */}
      {(relatedProjects.length > 0 || relatedPublication) && (
        <section className={styles.relatedSection}>
          <div className={styles.container}>
            <h2 className={styles.relatedTitle}>Related</h2>
            <div className={styles.relatedGrid}>
              {relatedProjects.map((relatedProject) => (
                <div key={relatedProject.slug} className={styles.relatedCard}>
                  <h3 className={styles.relatedSubTitle}>Project</h3>
                  {relatedProject.heroImage && (
                    <Link href={`/projects/${relatedProject.slug}`} style={{textDecoration: 'none'}}>
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
                      <h3 className={styles.relatedSubTitle} style={{marginTop: 0}}>{relatedProject.city}, {relatedProject.market}</h3>
                      <h4 style={{fontFamily: 'var(--font-family-secondary)', fontSize: '1.5rem', fontWeight: 'normal', color: 'var(--color-brand-paper)', margin: 0}}>{relatedProject.title}</h4>
                    </Link>
                  )}
                </div>
              ))}
              {relatedPublication && (
                <div className={styles.relatedCard}>
                  <h3 className={styles.relatedSubTitle}>Publication</h3>
                  <PublicationCard publication={relatedPublication} />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <ArticlePrevNext
        prev={prevNews ? { href: `/insights/news/${prevNews.slug}`, title: prevNews.title } : null}
        next={nextNews ? { href: `/insights/news/${nextNews.slug}`, title: nextNews.title } : null}
      />
    </main>
  );
}
