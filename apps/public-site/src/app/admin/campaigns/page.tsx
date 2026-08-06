import Link from 'next/link';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { CreateCampaignForm } from './CreateCampaignForm';
import styles from '../../../components/portal/portal-ui.module.css';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badgeActive',
  DRAFT: 'badgeMuted',
  COMPLETED: 'badgeWarn',
  ARCHIVED: 'badgeMuted',
};

export default async function AdminCampaignsPage() {
  const principal = await requireAdminPage();

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { newsPosts: true, socialPosts: true, generatedGraphics: true, landingPages: true } } },
  });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Campaigns</h1>
      </div>
      <p className={styles.subtitle}>
        The top-level marketing object — a campaign groups the articles, social posts, generated graphics, and landing
        pages built for it. Link items to a campaign from their own editors.
      </p>

      <div className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Articles</th>
                <th>Social posts</th>
                <th>Graphics</th>
                <th>Landing pages</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={7}>No campaigns yet — create one below.</td>
                </tr>
              )}
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td><span className={`${styles.badge} ${styles[STATUS_BADGE[c.status] ?? 'badgeMuted']}`}>{c.status}</span></td>
                  <td>{c._count.newsPosts}</td>
                  <td>{c._count.socialPosts}</td>
                  <td>{c._count.generatedGraphics}</td>
                  <td>{c._count.landingPages}</td>
                  <td><Link href={`/admin/campaigns/${c.id}`}>Manage</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Create a campaign</h2>
        <CreateCampaignForm />
      </div>
    </PortalShell>
  );
}
