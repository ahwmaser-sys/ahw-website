import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { EditCampaignForm } from './EditCampaignForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

function toDateInputValue(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

export default async function AdminCampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireAdminPage();
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      newsPosts: { select: { id: true, title: true, status: true } },
      socialPosts: { select: { id: true, platform: true, status: true, newsPostId: true } },
      generatedGraphics: { select: { id: true, templateId: true, createdAt: true }, include: { template: { select: { name: true } } } },
      landingPages: { select: { id: true, title: true, status: true } },
    },
  });

  if (!campaign) notFound();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/campaigns" className={styles.backLink}>← All campaigns</Link>

      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{campaign.name}</h1>
        <span className={styles.badge}>{campaign.status}</span>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Details</h2>
        <EditCampaignForm
          campaignId={campaign.id}
          name={campaign.name}
          description={campaign.description}
          status={campaign.status}
          startDate={toDateInputValue(campaign.startDate)}
          endDate={toDateInputValue(campaign.endDate)}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Articles ({campaign.newsPosts.length})</h2>
        <div className={styles.cardList}>
          {campaign.newsPosts.length === 0 && <p className={styles.cardMeta}>No articles linked yet — link one from its editor.</p>}
          {campaign.newsPosts.map((p) => (
            <div key={p.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong>{p.title}</strong>
                <span className={styles.badge}>{p.status}</span>
              </div>
              <Link href={`/admin/news/${p.id}`}>Open</Link>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Social posts ({campaign.socialPosts.length})</h2>
        <div className={styles.cardList}>
          {campaign.socialPosts.length === 0 && <p className={styles.cardMeta}>Generated automatically when a linked article is published.</p>}
          {campaign.socialPosts.map((sp) => (
            <div key={sp.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong>{sp.platform}</strong>
                <span className={styles.badge}>{sp.status}</span>
              </div>
              <Link href={`/admin/news/${sp.newsPostId}`}>Open article</Link>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Generated graphics ({campaign.generatedGraphics.length})</h2>
        <div className={styles.cardList}>
          {campaign.generatedGraphics.length === 0 && <p className={styles.cardMeta}>None yet — generate one from the Templates page and attach it to this campaign.</p>}
          {campaign.generatedGraphics.map((g) => (
            <div key={g.id} className={styles.card}>
              <strong>{g.template.name}</strong>
              <Link href={`/admin/templates/${g.templateId}`}>View history</Link>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Landing pages ({campaign.landingPages.length})</h2>
        <div className={styles.cardList}>
          {campaign.landingPages.length === 0 && <p className={styles.cardMeta}>None yet — link one from the Landing Pages editor.</p>}
          {campaign.landingPages.map((lp) => (
            <div key={lp.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong>{lp.title}</strong>
                <span className={styles.badge}>{lp.status}</span>
              </div>
              <Link href={`/admin/landing-pages/${lp.id}`}>Open</Link>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
