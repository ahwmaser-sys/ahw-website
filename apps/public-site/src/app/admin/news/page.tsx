import Link from 'next/link';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { sweepScheduledNewsPosts } from '../../../lib/portal/actions/news';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { CreateNewsForm } from './CreateNewsForm';
import styles from '../../../components/portal/portal-ui.module.css';

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'badgeActive',
  SCHEDULED: 'badgeWarn',
  DRAFT: 'badgeMuted',
};

export default async function AdminNewsPage() {
  const principal = await requireAdminPage();

  await sweepScheduledNewsPosts();

  const posts = await prisma.newsPost.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { name: true } } },
  });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>News</h1>
      </div>

      <div className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Author</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={4}>No news posts yet — create one below.</td>
                </tr>
              )}
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[STATUS_BADGE[post.status] ?? 'badgeMuted']}`}>{post.status}</span>
                  </td>
                  <td>{post.author.name}</td>
                  <td>
                    <Link href={`/admin/news/${post.id}`}>Manage</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Write a post</h2>
        <CreateNewsForm />
      </div>
    </PortalShell>
  );
}
