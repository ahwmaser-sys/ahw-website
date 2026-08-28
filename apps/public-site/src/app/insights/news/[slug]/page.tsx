import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { projects, publications, StructuredData, Breadcrumbs, buildBreadcrumbJsonLd, PublicationCard, SocialShare, ScrollReveal } from '@agp/ui-components';
import { getPublicNewsItems } from '../../../../lib/portal/public-news';
import { recordPageView } from '../../../../lib/portal/analytics/track';
import { getSiteUrl } from '../../../../lib/site-config';
import styles from './page.module.css';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

// Article body is authored as plain text (no rich-text/markdown editor
// exists yet), so it arrives as one long string with blank-line-separated
// paragraphs and, by convention, an ALL-CAPS line marking a subheading
// (e.g. "DESIGN THAT UNDERSTANDS DELIVERY") — previously rendered as one
// undifferentiated <p>, which is why a subheading looked identical to
// body text. Splits on blank lines and promotes a short all-caps single
// line to a real subheading instead.
function isHeadingLine(block: string): boolean {
  return !block.includes('\n') && block.length <= 100 && /[A-Za-z]/.test(block) && block === block.toUpperCase();
}

// Magazine-style layout: gallery photos float alternating left/right
// through the running text (CSS float — text wraps around each image
// natively, no fixed pairing between a specific paragraph and image),
// inserted every other paragraph so they're spread through the article
// rather than clumped. Any gallery images left over once the text runs
// out still render, alternating sides, after the last paragraph — an
// editor who added five photos to a three-paragraph note should still
// see all five, not have two silently dropped.
const GALLERY_INSERT_INTERVAL = 2;

function renderArticleBody(
  content: string,
  galleryImages: { id: string; url: string; alt: string }[],
  styles: Record<string, string>,
) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const galleryElement = (image: { id: string; url: string; alt: string }, index: number) => {
    const isLeft = index % 2 === 0;
    return (
      <ScrollReveal
        key={`gallery-${image.id}`}
        direction={isLeft ? 'left' : 'right'}
        width="fit-content"
        className={isLeft ? styles.galleryFloatLeft : styles.galleryFloatRight}
      >
        <div className={styles.galleryImageWrapper}>
          <Image src={image.url} alt={image.alt} fill sizes="(max-width: 640px) 100vw, 340px" className={styles.galleryImage} loading="lazy" />
        </div>
      </ScrollReveal>
    );
  };

  const elements: ReactNode[] = [];
  let paragraphCount = 0;
  let galleryIndex = 0;

  blocks.forEach((block, i) => {
    if (isHeadingLine(block)) {
      elements.push(
        <ScrollReveal key={`heading-${i}`} direction="up">
          <h2 className={styles.sectionHeading}>{block}</h2>
        </ScrollReveal>,
      );
      return;
    }

    elements.push(
      <ScrollReveal key={`para-${i}`} direction="up">
        <p className={styles.textContent}>{block}</p>
      </ScrollReveal>,
    );
    paragraphCount += 1;

    const nextImage = galleryImages[galleryIndex];
    if (nextImage && paragraphCount % GALLERY_INSERT_INTERVAL === 0) {
      elements.push(galleryElement(nextImage, galleryIndex));
      galleryIndex += 1;
    }
  });

  let remainingImage = galleryImages[galleryIndex];
  while (remainingImage) {
    elements.push(galleryElement(remainingImage, galleryIndex));
    galleryIndex += 1;
    remainingImage = galleryImages[galleryIndex];
  }

  return elements;
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
  const relatedProjects = (news.relatedProjectSlugs ?? [])
    .map((slug) => projects.find((p) => p.slug === slug))
    .filter((p): p is typeof projects[number] => Boolean(p));

  const relatedPublication = news.relatedPublicationId
    ? publications.find(p => p.id === news.relatedPublicationId)
    : null;

  return (
    <main className={styles.main}>
      <StructuredData data={jsonLd} />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />

      <article className={styles.article}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.container}>
            <Breadcrumbs items={breadcrumbs} />
            <div className={styles.meta}>
              <time dateTime={news.date} className={styles.date}>
                {new Date(news.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
              {news.readingTime && (
                <>
                  <span className={styles.separator}>—</span>
                  <span className={styles.readingTime}>{news.readingTime}</span>
                </>
              )}
            </div>
            <h1 className={styles.title}>{news.title}</h1>
            {news.tags && (
              <div className={styles.tags}>
                {news.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Cover Image */}
        {news.coverImage && (
          <ScrollReveal direction="none" duration={0.8}>
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
          </ScrollReveal>
        )}

        {/* Content */}
        <div className={styles.container}>
          <div className={styles.contentWrapper}>
            <div className={styles.content}>
              {renderArticleBody(news.content || news.excerpt, news.galleryImages ?? [], styles)}
            </div>
            <SocialShare url={`${siteUrl}/insights/news/${news.slug}`} title={news.title} />
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
    </main>
  );
}
