import type { Metadata } from 'next';
import Image from 'next/image';
import { Breadcrumbs, StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getLiveSocialFeed } from '../../lib/portal/social/live-feed';
import { getActiveOffices, officeSocialLinks } from '../../lib/portal/offices';
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

// Real brand colors, used sparingly as a small per-card accent dot —
// not the page's own palette — so a scan down the grid tells platforms
// apart at a glance.
const PLATFORM_ACCENT: Record<string, string> = {
  LINKEDIN: '#0A66C2',
  FACEBOOK: '#1877F2',
  INSTAGRAM: 'linear-gradient(45deg, #f58529, #dd2a7b, #8134af, #515bd4)',
  GOOGLE_BUSINESS: '#4285F4',
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
  const [allPosts, siteUrl, offices] = await Promise.all([getLiveSocialFeed(), getSiteUrl(), getActiveOffices()]);
  // Hidden via Admin → Marketing → Social Feed (lib/portal/actions/
  // social.ts's hideSocialFeedPost) — real posts stay on the platform
  // itself, this just keeps them off this public page.
  const posts = allPosts.filter((post) => !post.hidden);

  // Same admin-entered URLs the site footer already uses (Settings →
  // Offices) — not derived from the OAuth connections above, since an
  // office can have a public profile worth following even on a
  // platform this app doesn't (yet) have publishing access to.
  const followLinks = offices.flatMap((office) => {
    const links = officeSocialLinks(office);
    return (['instagram', 'facebook', 'linkedin'] as const)
      .filter((platform) => links[platform])
      .map((platform) => ({ platform, officeName: office.displayName, url: links[platform]! }));
  });

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
                        <span className={styles.platform}>
                          <span className={styles.platformDot} style={{ background: PLATFORM_ACCENT[post.platform] }} aria-hidden="true" />
                          {PLATFORM_LABEL[post.platform] ?? post.platform}
                        </span>
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

      {followLinks.length > 0 && (
        <section className={styles.followSection}>
          <div className={styles.container}>
            <h2 className={styles.followTitle}>Follow us for more</h2>
            <p className={styles.followSubtitle}>This page shows recent highlights from the last couple of months — follow along on the platforms themselves for everything else.</p>
            <div className={styles.followLinks}>
              {followLinks.map((link) => (
                <a key={`${link.platform}-${link.officeName}`} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.followPill}>
                  <span className={styles.platformDot} style={{ background: PLATFORM_ACCENT[link.platform.toUpperCase()] }} aria-hidden="true" />
                  {PLATFORM_LABEL[link.platform.toUpperCase()] ?? link.platform} · {link.officeName}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
