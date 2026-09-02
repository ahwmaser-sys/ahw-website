import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { MediaThumbnail } from '../../../../components/portal/MediaThumbnail';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import {
  EditMetadataForm,
  EditContentForm,
  CoverImageForm,
  ClearCoverImageForm,
  EditRelatedForm,
  PublishForm,
  UnpublishForm,
  DeleteForm,
} from './PublicationDetailForms';
import styles from '../../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminPublicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireAdminPage();
  const { id } = await params;

  const pub = await prisma.publication.findUnique({ where: { id } });
  if (!pub) notFound();

  const projectOptions = await prisma.portfolioProject.findMany({
    select: { slug: true, title: true },
    orderBy: { title: 'asc' },
  });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/publications" className={styles.backLink}>← All publications</Link>

      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{pub.title}</h1>
        <span className={`${styles.badge} ${pub.status === 'PUBLISHED' ? styles.badgeActive : styles.badgeMuted}`}>{pub.status}</span>
      </div>
      {pub.status === 'PUBLISHED' && (
        <p className={styles.subtitle}>
          Live at <a href={`/insights/publications/${pub.slug}`} target="_blank" rel="noreferrer">/insights/publications/{pub.slug}</a>
        </p>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Metadata</h2>
        <EditMetadataForm
          publicationId={pub.id}
          title={pub.title}
          slug={pub.slug}
          outlet={pub.outlet}
          url={pub.url}
          date={pub.date}
          readingTime={pub.readingTime}
          tags={pub.tags}
          isFeatured={pub.isFeatured}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Cover image</h2>
        {(pub.coverImageId || pub.coverImageUrl) ? (
          <div className={styles.cardList}>
            <div className={styles.card}>
              {pub.coverImageId ? (
                <MediaThumbnail assetId={pub.coverImageId} alt={pub.title} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of a legacy static path
                <img src={pub.coverImageUrl ?? ''} alt={pub.title} style={{ maxWidth: 240, maxHeight: 180, objectFit: 'cover' }} />
              )}
              <ClearCoverImageForm publicationId={pub.id} />
            </div>
          </div>
        ) : (
          <p className={styles.cardMeta}>No image set.</p>
        )}
        <CoverImageForm publicationId={pub.id} coverImageCaption={pub.coverImageCaption} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Content</h2>
        <EditContentForm publicationId={pub.id} excerpt={pub.excerpt} content={pub.content} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Related</h2>
        <EditRelatedForm publicationId={pub.id} relatedProjectSlugs={pub.relatedProjectSlugs} projectOptions={projectOptions} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Publishing</h2>
        <div className={styles.buttonRow}>
          {pub.status !== 'PUBLISHED' && <PublishForm publicationId={pub.id} />}
          {pub.status === 'PUBLISHED' && <UnpublishForm publicationId={pub.id} />}
        </div>
      </div>

      {principal.roles.includes('SUPER_ADMIN') && pub.status !== 'PUBLISHED' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Manage</h2>
          <DeleteForm publicationId={pub.id} />
        </div>
      )}
    </PortalShell>
  );
}
