import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { prisma } from '../../../lib/portal/db';
import { collectAssetIds, type LandingPageBlock } from '../../../lib/content-studio/landing-page-blocks';
import { recordPageView } from '../../../lib/portal/analytics/track';
import { getSiteUrl } from '../../../lib/site-config';
import styles from './page.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPublishedPage(slug: string) {
  const page = await prisma.landingPage.findUnique({ where: { slug } });
  if (!page || page.status !== 'PUBLISHED') return null;
  return page;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) return { title: 'Not Found' };

  const siteUrl = await getSiteUrl();

  return {
    title: page.metaTitle ?? page.title,
    description: page.metaDescription ?? undefined,
    alternates: { canonical: `${siteUrl}/lp/${page.slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) notFound();

  recordPageView({ path: `/lp/${page.slug}`, entityType: 'LandingPage', entityId: page.id, campaignId: page.campaignId ?? undefined });

  const blocks = page.blocks as unknown as LandingPageBlock[];
  const assetIds = [...new Set(collectAssetIds(blocks))];
  const assets = assetIds.length > 0 ? await prisma.mediaAsset.findMany({ where: { id: { in: assetIds } } }) : [];
  const assetById = new Map(assets.map((a) => [a.id, a]));

  return (
    <main className={styles.main}>
      {blocks.map((block, index) => {
        if (block.type === 'hero') {
          const asset = block.imageAssetId ? assetById.get(block.imageAssetId) : undefined;
          return (
            <section key={index} className={styles.hero}>
              {asset && (
                <div className={styles.heroImage}>
                  <Image src={`/api/media/${asset.id}`} alt={asset.altText ?? page.title} fill sizes="100vw" priority />
                </div>
              )}
              <div className={styles.heroOverlay} />
              <div className={`${styles.container} ${styles.heroContent}`}>
                <h1 className={styles.headline}>{block.headline}</h1>
                {block.subheadline && <p className={styles.subheadline}>{block.subheadline}</p>}
                {block.ctaLabel && block.ctaUrl && (
                  <a href={block.ctaUrl} className={styles.ctaButton}>{block.ctaLabel}</a>
                )}
              </div>
            </section>
          );
        }

        if (block.type === 'text') {
          return (
            <section key={index} className={styles.section}>
              <div className={styles.container}>
                <div className={styles.textBlock}>
                  {block.heading && <h2 className={styles.textHeading}>{block.heading}</h2>}
                  <p className={styles.textBody}>{block.body}</p>
                </div>
              </div>
            </section>
          );
        }

        if (block.type === 'image') {
          const asset = assetById.get(block.assetId);
          if (!asset) return null;
          return (
            <section key={index} className={styles.section}>
              <div className={styles.container}>
                <div className={styles.imageBlock}>
                  <Image src={`/api/media/${asset.id}`} alt={asset.altText ?? block.caption ?? ''} fill sizes="(min-width: 768px) 720px, 100vw" />
                </div>
                {block.caption && <p className={styles.imageCaption}>{block.caption}</p>}
              </div>
            </section>
          );
        }

        if (block.type === 'cta') {
          return (
            <section key={index} className={styles.section}>
              <div className={styles.container}>
                <a href={block.url} className={styles.ctaButton}>{block.label}</a>
              </div>
            </section>
          );
        }

        if (block.type === 'gallery') {
          return (
            <section key={index} className={styles.section}>
              <div className={styles.container}>
                <div className={styles.gallery}>
                  {block.assetIds.map((assetId) => {
                    const asset = assetById.get(assetId);
                    if (!asset) return null;
                    return (
                      <div key={assetId} className={styles.galleryImage}>
                        <Image src={`/api/media/${asset.id}`} alt={asset.altText ?? ''} fill sizes="(min-width: 768px) 33vw, 100vw" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        }

        return null;
      })}
    </main>
  );
}
