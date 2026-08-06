import Link from 'next/link';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { GenerateGraphicsForm } from './GenerateGraphicsForm';
import { CreateTemplateForm } from './CreateTemplateForm';
import { OUTPUT_TARGETS } from '../../../lib/portal/media/output-targets';
import type { TemplateDefinition } from '../../../lib/content-studio/template-engine/types';
import styles from '../../../components/portal/portal-ui.module.css';

export default async function AdminTemplatesPage() {
  const principal = await requireAdminPage();

  const [allTemplates, imageAssets, newsPosts, campaigns] = await Promise.all([
    // Every template, active or not — a deactivated one must stay
    // reachable here to be reactivated (see [id]/page.tsx's Manage
    // section), or "Disable" would be a one-way door with no UI path
    // back.
    prisma.socialTemplate.findMany({ orderBy: [{ isActive: 'desc' }, { category: 'asc' }] }),
    prisma.mediaAsset.findMany({ where: { kind: 'IMAGE' }, select: { id: true, fileName: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.newsPost.findMany({ select: { id: true, title: true }, orderBy: { createdAt: 'desc' }, take: 30 }),
    prisma.campaign.findMany({ select: { id: true, name: true }, orderBy: { createdAt: 'desc' } }),
  ]);

  // The generator itself only ever offers active templates.
  const activeTemplates = allTemplates.filter((t) => t.isActive);
  const templateOptions = activeTemplates.map((t) => ({
    id: t.id,
    key: t.key,
    name: t.name,
    variables: (t.definition as unknown as TemplateDefinition).variables as string[],
  }));

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Templates</h1>
      </div>

      <div className={styles.section}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Official</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allTemplates.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.category}</td>
                  <td>{t.isOfficial ? 'Yes' : 'No'}</td>
                  <td>
                    <span className={`${styles.badge} ${t.isActive ? styles.badgeActive : styles.badgeMuted}`}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td><Link href={`/admin/templates/${t.id}`}>Manage</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Generate graphics</h2>
        <p className={styles.cardMeta}>Choose a template, choose an image, generate — every platform size is produced automatically.</p>
        <GenerateGraphicsForm templates={templateOptions} assets={imageAssets} outputTargets={[...OUTPUT_TARGETS]} newsPosts={newsPosts} campaigns={campaigns} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Create a custom template</h2>
        <CreateTemplateForm />
      </div>
    </PortalShell>
  );
}
