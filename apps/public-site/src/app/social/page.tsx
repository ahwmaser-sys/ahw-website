import type { Metadata } from 'next';
import Image from 'next/image';
import { Breadcrumbs, StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getLiveSocialFeed } from '../../lib/portal/social/live-feed';
import { getSiteUrl } from '../../lib/site-config';
import styles from './page.module.css';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Social' },
];

// Refetches from each platform at most every 30 minutes (see
// live-feed.ts's own REVALIDATE_SECONDS on each fetch call) — this
// page-level revalidate just governs how often Next re-renders the
// page shell around that already-cached data.
export const revalidate = 1800;

const PLATFORM_LABEL: Record<string, string> = {
  LINKEDIN: 'LinkedIn',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  GOOGLE_BUSINESS: 'Google Business Profile',
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  return {
    title: 'Social',
    description: 'Recent posts from AHW Architects across LinkedIn, Facebook, Instagram, and Google Business Profile.',
    alternates: { canonical: `${siteUrl}/social` },
    openGraph: {
      title: 'Social',
      description: 'Recent posts from AHW Architects across LinkedIn, Facebook, Instagram, and Google Business Profile.',
      url: '/social',
    },
  };
}

export default async function SocialPage() {
  const [posts, siteUrl] = await Promise.all([getLiveSocialFeed(), getSiteUrl()]);

  return (
    <main className={styles.main}>
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs, siteUrl)} />
      <section className={styles.hero}>
        <div className={styles.container}>
          <Breadcrumbs items={breadcrumbs} />
          <h1 className={styles.title}>Social</h1>
          <p className={styles.subtitle}>Recent posts from AHW Architects — pulled live from LinkedIn, Facebook, Instagram, and Google Business Profile.</p>
        </div>
      </section>

      <section className={styles.feedSection}>
        <div className={styles.container}>
          {posts.length === 0 ? (
            <p className={styles.empty}>No recent posts to show right now.</p>
          ) : (
            <div className={styles.grid}>
              {posts.map((post) => {
                const date = formatDate(post.postedAt);
                const card = (
                  <>
                    {post.imageUrl && (
                      <div className={styles.imageWrapper}>
                        <Image src={post.imageUrl} alt="" fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw" className={styles.image} />
                      </div>
                    )}
                    <div className={styles.cardBody}>
                      <div className={styles.cardMeta}>
                        <span className={styles.platform}>{PLATFORM_LABEL[post.platform] ?? post.platform}</span>
                        <span className={styles.office}>{post.officeName}</span>
                      </div>
                      {post.caption && <p className={styles.caption}>{post.caption}</p>}
                      {date && <time className={styles.date}>{date}</time>}
                    </div>
                  </>
                );
                return post.permalink ? (
                  <a key={post.id} href={post.permalink} target="_blank" rel="noreferrer" className={styles.card}>
                    {card}
                  </a>
                ) : (
                  <div key={post.id} className={styles.card}>
                    {card}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
