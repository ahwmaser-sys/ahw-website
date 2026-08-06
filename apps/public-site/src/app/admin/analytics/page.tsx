import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { ga4AnalyticsProvider } from '../../../lib/portal/analytics/ga4-port';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import styles from '../../../components/portal/portal-ui.module.css';

export default async function AdminAnalyticsPage() {
  const principal = await requireAdminPage();

  // Content performance — self-hosted, real, works with zero external
  // dependency. Grouped by (entityType, entityId), which for Project/
  // NewsPost is a slug (see track.ts call sites), for LandingPage a
  // real database id.
  const topProjects = await prisma.pageView.groupBy({
    by: ['entityId'],
    where: { entityType: 'Project' },
    _count: { entityId: true },
    orderBy: { _count: { entityId: 'desc' } },
    take: 10,
  });
  const topArticles = await prisma.pageView.groupBy({
    by: ['entityId'],
    where: { entityType: 'NewsPost' },
    _count: { entityId: true },
    orderBy: { _count: { entityId: 'desc' } },
    take: 10,
  });
  const topLandingPageViews = await prisma.pageView.groupBy({
    by: ['entityId'],
    where: { entityType: 'LandingPage' },
    _count: { entityId: true },
    orderBy: { _count: { entityId: 'desc' } },
    take: 10,
  });
  const landingPageIds = topLandingPageViews.map((v) => v.entityId).filter((id): id is string => Boolean(id));
  const landingPages = landingPageIds.length > 0 ? await prisma.landingPage.findMany({ where: { id: { in: landingPageIds } } }) : [];
  const landingPageById = new Map(landingPages.map((p) => [p.id, p]));

  // Campaign performance — real counts + real view totals per campaign.
  const campaigns = await prisma.campaign.findMany({
    include: { _count: { select: { newsPosts: true, socialPosts: true, generatedGraphics: true, landingPages: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const campaignViews = await prisma.pageView.groupBy({
    by: ['campaignId'],
    where: { campaignId: { not: null } },
    _count: { campaignId: true },
  });
  const viewsByCampaign = new Map(campaignViews.map((v) => [v.campaignId, v._count.campaignId]));

  // Media usage — real, from MediaAssetUsage, not a guess.
  const usageCounts = await prisma.mediaAssetUsage.groupBy({
    by: ['assetId'],
    _count: { assetId: true },
    orderBy: { _count: { assetId: 'desc' } },
    take: 10,
  });
  const usedAssetIds = usageCounts.map((u) => u.assetId);
  const usedAssets = usedAssetIds.length > 0 ? await prisma.mediaAsset.findMany({ where: { id: { in: usedAssetIds } } }) : [];
  const assetById = new Map(usedAssets.map((a) => [a.id, a]));

  // Engagement — real SocialPost status counts, not fabricated
  // engagement numbers (likes/reach live on each platform, unreachable
  // without real credentials — see the SEO section's honest state below
  // for the same principle applied to organic traffic).
  const socialStatusCounts = await prisma.socialPost.groupBy({
    by: ['platform', 'status'],
    _count: { status: true },
  });

  const ga4Configured = await ga4AnalyticsProvider.isConfigured();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Analytics</h1>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Content performance</h2>
        <p className={styles.cardMeta}>Self-hosted page views — real, works with no external dependency.</p>
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label}>Most viewed projects</label>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <tbody>
                  {topProjects.length === 0 && <tr className={styles.emptyRow}><td>No data yet.</td></tr>}
                  {topProjects.map((row) => (
                    <tr key={row.entityId}>
                      <td>{row.entityId}</td>
                      <td>{row._count.entityId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Most viewed articles</label>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <tbody>
                  {topArticles.length === 0 && <tr className={styles.emptyRow}><td>No data yet.</td></tr>}
                  {topArticles.map((row) => (
                    <tr key={row.entityId}>
                      <td>{row.entityId}</td>
                      <td>{row._count.entityId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Most viewed landing pages</label>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <tbody>
                  {topLandingPageViews.length === 0 && <tr className={styles.emptyRow}><td>No data yet.</td></tr>}
                  {topLandingPageViews.map((row) => (
                    <tr key={row.entityId}>
                      <td>{row.entityId ? landingPageById.get(row.entityId)?.title ?? row.entityId : '—'}</td>
                      <td>{row._count.entityId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>SEO</h2>
        {ga4Configured ? (
          <p className={styles.cardMeta}>Google Analytics is connected.</p>
        ) : (
          <p className={styles.cardMeta}>
            Organic traffic and top keywords require a real Google Analytics Data API / Search Console credential —
            <code> NEXT_PUBLIC_GA_MEASUREMENT_ID</code> sends events to GA4 but does not grant this app permission to
            read data back out. Not connected in this environment — view live numbers directly at{' '}
            <a href="https://analytics.google.com" target="_blank" rel="noreferrer">analytics.google.com</a> or{' '}
            <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Search Console</a> until
            this is wired up.
          </p>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Campaign performance</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Articles</th>
                <th>Social posts</th>
                <th>Graphics</th>
                <th>Landing pages</th>
                <th>Landing page views</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && <tr className={styles.emptyRow}><td colSpan={6}>No campaigns yet.</td></tr>}
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c._count.newsPosts}</td>
                  <td>{c._count.socialPosts}</td>
                  <td>{c._count.generatedGraphics}</td>
                  <td>{c._count.landingPages}</td>
                  <td>{viewsByCampaign.get(c.id) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Media usage</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Used in</th>
              </tr>
            </thead>
            <tbody>
              {usageCounts.length === 0 && <tr className={styles.emptyRow}><td colSpan={2}>No usage data yet.</td></tr>}
              {usageCounts.map((row) => (
                <tr key={row.assetId}>
                  <td>{assetById.get(row.assetId)?.fileName ?? row.assetId}</td>
                  <td>{row._count.assetId} place(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Social engagement</h2>
        <p className={styles.cardMeta}>
          Real dispatch status per platform — likes/reach/comments live on each platform and aren't reachable without
          real credentials (all four adapters are in Manual mode in this environment), so this shows what actually
          happened at the publishing layer, not fabricated engagement numbers.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Platform</th>
                <th>Status</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {socialStatusCounts.length === 0 && <tr className={styles.emptyRow}><td colSpan={3}>No social posts yet.</td></tr>}
              {socialStatusCounts.map((row) => (
                <tr key={`${row.platform}-${row.status}`}>
                  <td>{row.platform}</td>
                  <td>{row.status}</td>
                  <td>{row._count.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}
