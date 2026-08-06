import Link from 'next/link';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { MediaThumbnail } from '../../../components/portal/MediaThumbnail';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { UploadMediaForm } from './UploadMediaForm';
import { CreateCollectionForm, CreateCategoryForm, DeleteCategoryForm, DeleteTagForm } from './CollectionForms';
import portalStyles from '../../../components/portal/portal-ui.module.css';
import styles from './page.module.css';

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; q?: string; archived?: string }>;
}) {
  const principal = await requireAdminPage();
  const { kind, q, archived } = await searchParams;
  const showArchived = archived === '1';

  const [assets, projects, collections, categories, tags] = await Promise.all([
    prisma.mediaAsset.findMany({
      where: {
        archivedAt: showArchived ? { not: null } : null,
        ...(kind ? { kind: kind as never } : {}),
        ...(q
          ? {
              OR: [
                { fileName: { contains: q, mode: 'insensitive' } },
                { keywords: { has: q } },
                { altText: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.mediaCollection.findMany({ orderBy: { name: 'asc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={portalStyles.pageHeader}>
        <h1 className={portalStyles.title}>Media Library</h1>
        <Link href={showArchived ? '/admin/media' : '/admin/media?archived=1'} className={portalStyles.linkButton}>
          {showArchived ? '← Back to library' : 'View archived'}
        </Link>
      </div>

      <form className={portalStyles.formRow}>
        {showArchived && <input type="hidden" name="archived" value="1" />}
        <div className={portalStyles.field}>
          <label className={portalStyles.label} htmlFor="q">Search</label>
          <input className={portalStyles.input} id="q" name="q" defaultValue={q ?? ''} placeholder="filename, keyword, alt text" />
        </div>
        <div className={portalStyles.field}>
          <label className={portalStyles.label} htmlFor="kind">Type</label>
          <select className={portalStyles.select} id="kind" name="kind" defaultValue={kind ?? ''}>
            <option value="">All</option>
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="DOCUMENT">Document</option>
            <option value="ICON">Icon</option>
            <option value="LOGO">Logo</option>
          </select>
        </div>
        <button type="submit" className={portalStyles.buttonSecondary}>Filter</button>
      </form>

      <div className={portalStyles.section}>
        <div className={styles.grid}>
          {assets.length === 0 && <p className={portalStyles.cardMeta}>No assets match — upload one below.</p>}
          {assets.map((asset) => (
            <Link key={asset.id} href={`/admin/media/${asset.id}`} className={styles.tile}>
              <MediaThumbnail assetId={asset.id} alt={asset.altText ?? asset.fileName} dominantColors={asset.dominantColors} />
              <span className={styles.tileName}>{asset.fileName}</span>
              <span className={portalStyles.cardMeta}>{asset.kind}{asset.width ? ` · ${asset.width}×${asset.height}` : ''}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className={portalStyles.section}>
        <h2 className={portalStyles.sectionTitle}>Upload</h2>
        <UploadMediaForm projects={projects} />
      </div>

      <div className={portalStyles.section}>
        <h2 className={portalStyles.sectionTitle}>Collections</h2>
        <div className={portalStyles.tableWrap}>
          <table className={portalStyles.table}>
            <thead>
              <tr>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {collections.length === 0 && (
                <tr className={portalStyles.emptyRow}>
                  <td>No collections yet.</td>
                </tr>
              )}
              {collections.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={portalStyles.formSpacer}>
          <CreateCollectionForm />
        </div>
      </div>

      <div className={portalStyles.section}>
        <h2 className={portalStyles.sectionTitle}>Categories</h2>
        <p className={portalStyles.cardMeta}>Shared taxonomy between the Media Library and Articles.</p>
        <div className={portalStyles.tableWrap}>
          <table className={portalStyles.table}>
            <tbody>
              {categories.length === 0 && (
                <tr className={portalStyles.emptyRow}><td>No categories yet.</td></tr>
              )}
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td><DeleteCategoryForm id={c.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={portalStyles.formSpacer}>
          <CreateCategoryForm />
        </div>
      </div>

      <div className={portalStyles.section}>
        <h2 className={portalStyles.sectionTitle}>Tags</h2>
        <p className={portalStyles.cardMeta}>Free-form, created inline while editing an article or asset — clean up unused ones here.</p>
        <div className={portalStyles.tableWrap}>
          <table className={portalStyles.table}>
            <tbody>
              {tags.length === 0 && (
                <tr className={portalStyles.emptyRow}><td>No tags yet.</td></tr>
              )}
              {tags.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td><DeleteTagForm id={t.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}
