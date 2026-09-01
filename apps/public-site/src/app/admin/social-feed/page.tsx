import type { Metadata } from 'next';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { getLiveSocialFeed } from '../../../lib/portal/social/live-feed';
import { HideSocialFeedPostForm, UnhideSocialFeedPostForm, PinSocialFeedPostForm, UnpinSocialFeedPostForm } from './SocialFeedForms';
import styles from '../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const PLATFORM_LABEL: Record<string, string> = {
  LINKEDIN: 'LinkedIn',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  GOOGLE_BUSINESS: 'Google Business Profile',
};

export default async function AdminSocialFeedPage() {
  const principal = await requireAdminPage();
  const posts = await getLiveSocialFeed();
  const visibleCount = posts.filter((p) => !p.hidden).length;
  const hiddenCount = posts.length - visibleCount;

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Social Feed</h1>
      </div>
      <p className={styles.subtitle}>
        The same real posts shown on the public{' '}
        <a href="/social" target="_blank" rel="noreferrer">/social</a> page — pulled live from each connected platform,
        not stored here. Hide a post to remove it from that public page without touching anything on the platform
        itself, or pin one to keep it permanently featured regardless of age. {visibleCount} visible, {hiddenCount} hidden.
      </p>

      <div className={styles.section}>
        <div className={styles.cardList}>
          {posts.length === 0 && <p className={styles.cardMeta}>No posts found — check that a platform is connected under Settings → Integrations.</p>}
          {posts.map((post) => (
            <div key={post.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong>{PLATFORM_LABEL[post.platform] ?? post.platform} — {post.officeName}</strong>
                <span className={styles.buttonRow}>
                  {post.pinned && <span className={`${styles.badge} ${styles.badgeWarn}`}>Pinned</span>}
                  <span className={`${styles.badge} ${post.hidden ? styles.badgeMuted : styles.badgeActive}`}>
                    {post.hidden ? 'Hidden' : 'Visible'}
                  </span>
                </span>
              </div>
              {post.caption && <p className={styles.captionText}>{post.caption}</p>}
              {post.permalink && (
                <a href={post.permalink} target="_blank" rel="noreferrer" className={styles.cardMeta}>
                  {post.permalink}
                </a>
              )}
              <div className={styles.buttonRow}>
                {post.hidden ? <UnhideSocialFeedPostForm id={post.id} /> : <HideSocialFeedPostForm id={post.id} />}
                {post.pinned ? <UnpinSocialFeedPostForm id={post.id} /> : <PinSocialFeedPostForm id={post.id} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
