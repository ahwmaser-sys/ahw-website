import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { EditLandingPageForm, PublishLandingPageForm, UnpublishLandingPageForm, ArchiveLandingPageForm, RestoreLandingPageForm, DeleteLandingPageForm } from './LandingPageForms';
import styles from '../../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLandingPageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireAdminPage();
  const { id } = await params;

  const page = await prisma.landingPage.findUnique({ where: { id } });
  if (!page) notFound();

  const [campaigns, imageAssets] = await Promise.all([
    prisma.campaign.findMany({ select: { id: true, name: true }, orderBy: { createdAt: 'desc' } }),
    prisma.mediaAsset.findMany({ where: { kind: 'IMAGE' }, select: { id: true, fileName: true }, orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/landing-pages" className={styles.backLink}>← All landing pages</Link>

      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{page.title}</h1>
        <span className={styles.badge}>{page.status}</span>
      </div>
      {page.status === 'PUBLISHED' && (
        <p className={styles.subtitle}>
          Live at <a href={`/lp/${page.slug}`} target="_blank" rel="noreferrer">/lp/{page.slug}</a>
        </p>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Content</h2>
        <EditLandingPageForm
          pageId={page.id}
          title={page.title}
          blocksJson={JSON.stringify(page.blocks, null, 2)}
          campaignId={page.campaignId}
          metaTitle={page.metaTitle}
          metaDescription={page.metaDescription}
          ogImageId={page.ogImageId}
          campaigns={campaigns}
          imageAssets={imageAssets}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Publishing</h2>
        {page.status === 'PUBLISHED' ? (
          <UnpublishLandingPageForm pageId={page.id} />
        ) : page.status !== 'ARCHIVED' ? (
          <PublishLandingPageForm pageId={page.id} />
        ) : null}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Manage</h2>
        <div className={styles.buttonRow}>
          {page.status !== 'ARCHIVED' && <ArchiveLandingPageForm pageId={page.id} />}
          {page.status === 'ARCHIVED' && <RestoreLandingPageForm pageId={page.id} />}
          {page.status === 'DRAFT' && !page.publishedAt && <DeleteLandingPageForm pageId={page.id} />}
        </div>
      </div>
    </PortalShell>
  );
}
