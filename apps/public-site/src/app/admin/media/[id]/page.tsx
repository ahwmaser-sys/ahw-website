import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { MediaThumbnail } from '../../../../components/portal/MediaThumbnail';
import { MediaVariantThumbnail } from '../../../../components/portal/MediaVariantThumbnail';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { EditMetadataForm, DeleteAssetForm, ArchiveAssetForm, RestoreAssetForm, GenerateAITagsForm } from './MediaDetailForms';
import { AddToCollectionForm } from '../CollectionForms';
import styles from '../../../../components/portal/portal-ui.module.css';
import pageStyles from './page.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminMediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireAdminPage();
  const { id } = await params;

  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    include: {
      variants: true,
      tags: { include: { tag: true } },
      usages: true,
      project: { select: { name: true } },
    },
  });

  if (!asset) notFound();

  const collections = await prisma.mediaCollection.findMany({ orderBy: { name: 'asc' } });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/media" className={styles.backLink}>← Media Library</Link>

      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{asset.fileName}</h1>
        <span className={styles.badge}>{asset.kind}</span>
      </div>

      <div className={pageStyles.previewWrap}>
        <MediaThumbnail assetId={asset.id} alt={asset.altText ?? asset.fileName} dominantColors={asset.dominantColors} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Details</h2>
        <p className={styles.cardMeta}>
          {asset.width ? `${asset.width}×${asset.height}px · ` : ''}
          {(asset.fileSize / 1024).toFixed(0)} KB · {asset.fileType}
          {asset.durationSeconds ? ` · ${asset.durationSeconds}s` : ''}
          {asset.project ? ` · ${asset.project.name}` : ''}
          {asset.service ? ` · ${asset.service}` : ''}
        </p>
        {asset.usages.length > 0 && (
          <p className={styles.cardMeta}>Used in {asset.usages.length} place(s) — cannot be deleted while in use.</p>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Metadata</h2>
        <EditMetadataForm
          assetId={asset.id}
          photographer={asset.photographer}
          copyright={asset.copyright}
          altText={asset.altText}
          keywords={asset.keywords}
          tags={asset.tags.map((t) => t.tag.name)}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>AI tags</h2>
        {asset.aiTags.length > 0 ? (
          <p className={styles.cardMeta}>{asset.aiTags.join(', ')}</p>
        ) : (
          <p className={styles.cardMeta}>No AI tags generated yet.</p>
        )}
        <div className={styles.formSpacer}>
          <GenerateAITagsForm assetId={asset.id} />
        </div>
      </div>

      {asset.variants.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Generated variants</h2>
          <div className={pageStyles.variantGrid}>
            {asset.variants.map((v) => (
              <MediaVariantThumbnail key={v.id} assetId={asset.id} purpose={v.purpose} label={`${v.purpose} (${v.width}×${v.height})`} />
            ))}
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Collections</h2>
        <AddToCollectionForm assetId={asset.id} collections={collections} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Manage</h2>
        {asset.archivedAt ? (
          <>
            <p className={styles.cardMeta}>Archived {asset.archivedAt.toLocaleString()} — hidden from the default Media Library view.</p>
            <RestoreAssetForm assetId={asset.id} />
          </>
        ) : (
          <ArchiveAssetForm assetId={asset.id} />
        )}
        <DeleteAssetForm assetId={asset.id} />
      </div>
    </PortalShell>
  );
}
