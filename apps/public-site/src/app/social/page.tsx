import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs, ScrollReveal, StructuredData, buildBreadcrumbJsonLd } from '@agp/ui-components';
import { getLiveSocialFeed, type LiveSocialPost } from '../../lib/portal/social/live-feed';
import { getActiveOffices, officeSocialLinks } from '../../lib/portal/offices';
import { getSiteUrl } from '../../lib/site-config';
import styles from './page.module.css';

// Every Nth real post in the grid is replaced by a CTA tile instead of
// inserted alongside — someone who's scrolled this deep is already
// engaged with real, current work, which is the moment a "start your
// project" ask actually lands instead of reading as a banner to scroll
// past.
const CTA_EVERY = 6;

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

function SpotlightCard({ post, eyebrow }: { post: LiveSocialPost; eyebrow?: string }) {
  const date = formatDate(post.postedAt);
  return (
    <PostLink post={post} className={styles.spotlightCard}>
      <div className={styles.spotlightImageWrapper}>
        <Image src={post.imageUrl!} alt="" fill sizes="(min-width: 900px) 45vw, 100vw" priority className={styles.image} />
      </div>
      <div className={styles.spotlightBody}>
        {eyebrow && <span className={styles.spotlightEyebrow}>{eyebrow}</span>}
        <PostMeta post={post} />
        {post.caption && <p className={styles.spotlightCaption}>{post.caption}</p>}
        {date && <time className={styles.date}>{date}</time>}
      </div>
    </PostLink>
  );
}

function CtaTile() {
  return (
    <Link href="/contact" className={styles.ctaCard}>
      <span className={styles.ctaEyebrow}>AHW Architects</span>
      <span className={styles.ctaTitle}>Have a project in mind?</span>
      <p className={styles.ctaText}>From concept to completion — let&rsquo;s talk about what you&rsquo;re building.</p>
      <span className={styles.ctaButton}>Start Your Project →</span>
    </Link>
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
  // getLiveSocialFeed already returns newest-first. Only image-bearing
  // posts are eligible for a spotlight slot (a text-only card has
  // nothing to anchor the large treatment). A pinned post (see Admin →
  // Marketing → Social Feed) always gets its own spotlight — distinct
  // from "Latest" rather than merely replacing it — unless it happens
  // to already be the newest post, in which case one spotlight card
  // covers both and there's nothing to duplicate.
  const latestPost = posts.find((post) => post.imageUrl);
  const pinnedPost = posts.find((post) => post.pinned && post.imageUrl);
  const showTwoSpotlights = Boolean(pinnedPost && latestPost && pinnedPost.id !== latestPost.id);
  const spotlightIds = new Set(
    [latestPost?.id, showTwoSpotlights ? pinnedPost?.id : undefined].filter((id): id is string => Boolean(id)),
  );
  const rest = posts.filter((post) => !spotlightIds.has(post.id));

  const gridItems: ReactNode[] = [];
  rest.forEach((post, index) => {
    const date = formatDate(post.postedAt);
    gridItems.push(
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
      </PostLink>,
    );
    if ((index + 1) % CTA_EVERY === 0) {
      gridItems.push(<CtaTile key={`cta-${index}`} />);
    }
  });

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
          <span className={styles.liveBadge}>
            <span className={styles.liveDot} aria-hidden="true" />
            Live from the field
          </span>
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
              {latestPost && (
                <ScrollReveal direction="up">
                  {showTwoSpotlights && pinnedPost ? (
                    <div className={styles.spotlightGrid}>
                      <SpotlightCard post={pinnedPost} eyebrow="Pinned" />
                      <SpotlightCard post={latestPost} eyebrow="Latest" />
                    </div>
                  ) : (
                    <PostLink post={latestPost} className={styles.featuredCard}>
                      <div className={styles.featuredImageWrapper}>
                        <Image src={latestPost.imageUrl!} alt="" fill sizes="(min-width: 900px) 55vw, 100vw" priority className={styles.image} />
                      </div>
                      <div className={styles.featuredBody}>
                        <PostMeta post={latestPost} />
                        {latestPost.caption && <p className={styles.featuredCaption}>{latestPost.caption}</p>}
                        {formatDate(latestPost.postedAt) && <time className={styles.date}>{formatDate(latestPost.postedAt)}</time>}
                      </div>
                    </PostLink>
                  )}
                </ScrollReveal>
              )}

              {gridItems.length > 0 && (
                <ScrollReveal direction="up" delay={0.1}>
                  <div className={styles.grid}>{gridItems}</div>
                </ScrollReveal>
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
