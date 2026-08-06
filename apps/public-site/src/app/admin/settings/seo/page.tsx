import { readFile } from 'fs/promises';
import { join } from 'path';
import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import styles from '../../../../components/portal/portal-ui.module.css';

export default async function AdminSeoSettingsPage() {
  const principal = await requireAdminPage();

  const robotsTxt = await readFile(join(process.cwd(), 'public', 'robots.txt'), 'utf8').catch(() => 'Not found.');

  const [articlesMissingMeta, landingPagesMissingMeta, publishedArticles, publishedLandingPages] = await Promise.all([
    prisma.newsPost.count({ where: { status: 'PUBLISHED', OR: [{ metaTitle: null }, { metaDescription: null }] } }),
    prisma.landingPage.count({ where: { status: 'PUBLISHED', OR: [{ metaTitle: null }, { metaDescription: null }] } }),
    prisma.newsPost.count({ where: { status: 'PUBLISHED' } }),
    prisma.landingPage.count({ where: { status: 'PUBLISHED' } }),
  ]);

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>SEO</h1>
      </div>
      <p className={styles.subtitle}>
        Live diagnostics, not editable defaults — every article and landing page already has its own real SEO fields
        (see its own editor); this is where to check nothing published is missing them, plus what search engines are
        told directly. Organic traffic and keyword data live in{' '}
        <a href="/admin/settings/integrations">Settings → Integrations</a> once Google Search Console is connected.
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Meta tag coverage</h2>
        <div className={styles.cardList}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <strong>Articles</strong>
              <span className={`${styles.badge} ${articlesMissingMeta === 0 ? styles.badgeActive : styles.badgeWarn}`}>
                {publishedArticles - articlesMissingMeta}/{publishedArticles} complete
              </span>
            </div>
            {articlesMissingMeta > 0 && (
              <p className={styles.cardMeta}>{articlesMissingMeta} published article(s) missing a meta title or description — falls back to title/excerpt at render time, but worth reviewing.</p>
            )}
          </div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <strong>Landing pages</strong>
              <span className={`${styles.badge} ${landingPagesMissingMeta === 0 ? styles.badgeActive : styles.badgeWarn}`}>
                {publishedLandingPages - landingPagesMissingMeta}/{publishedLandingPages} complete
              </span>
            </div>
            {landingPagesMissingMeta > 0 && (
              <p className={styles.cardMeta}>{landingPagesMissingMeta} published landing page(s) missing a meta title or description.</p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Sitemap & robots.txt</h2>
        <p className={styles.cardMeta}>
          <a href="/sitemap.xml" target="_blank" rel="noreferrer">/sitemap.xml</a> is generated dynamically from published content on every request.
        </p>
        <pre className={styles.monospaceTextarea}>{robotsTxt}</pre>
      </div>
    </PortalShell>
  );
}
