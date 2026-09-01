import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { Breadcrumbs, StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getLiveSocialFeed, type LiveSocialPost } from '../../lib/portal/social/live-feed';
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

function PostMeta({ post }: { post: LiveSocialPost }) {
  return (
    <div className={styles.cardMeta}>
      <span className={styles.platform}>
        <span className={styles.platformDot} style={{ background: PLATFORM_ACCENT[post.platform] }} aria-hidden="true" />
        {PLATFORM_LABEL[post.platform] ?? post.platform}
      </span>
      <span className={styles.office}>{post.officeName}</span>
    </div>
  );
}

function PostLink({ post, children, className }: { post: LiveSocialPost; children: ReactNode; className: string | undefined }) {
  return post.permalink ? (
    <a href={post.permalink} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <div className={className}>{children}</div>
  );
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
  // getLiveSocialFeed already returns newest-first, so the most recent
  // post gets the large featured treatment; only image-bearing posts
  // are eligible (a text-only feature card has nothing to anchor the
  // large half of the layout), falling back to the plain grid otherwise.
  // A pinned post (see Admin → Marketing → Social Feed) takes the slot
  // ahead of whatever's merely newest.
  const featured = posts.find((post) => post.pinned && post.imageUrl) ?? posts.find((post) => post.imageUrl);
  const rest = posts.filter((post) => post.id !== featured?.id);

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
            <>
              {featured && (
                <PostLink post={featured} className={styles.featuredCard}>
                  <div className={styles.featuredImageWrapper}>
                    <Image src={featured.imageUrl!} alt="" fill sizes="(min-width: 900px) 55vw, 100vw" priority className={styles.image} />
                  </div>
                  <div className={styles.featuredBody}>
                    <PostMeta post={featured} />
                    {featured.caption && <p className={styles.featuredCaption}>{featured.caption}</p>}
                    {formatDate(featured.postedAt) && <time className={styles.date}>{formatDate(featured.postedAt)}</time>}
                  </div>
                </PostLink>
              )}

              {rest.length > 0 && (
                <div className={styles.grid}>
                  {rest.map((post) => {
                    const date = formatDate(post.postedAt);
                    return (
                      <PostLink key={post.id} post={post} className={styles.card}>
                        {post.imageUrl && (
                          <div className={styles.imageWrapper}>
                            <Image src={post.imageUrl} alt="" fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw" className={styles.image} />
                          </div>
                        )}
                        <div className={styles.cardBody}>
                          <PostMeta post={post} />
                          {post.caption && <p className={styles.caption}>{post.caption}</p>}
                          {date && <time className={styles.date}>{date}</time>}
                        </div>
                      </PostLink>
                    );
                  })}
                </div>
              )}
            </>
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
