import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { AssetDownloadLink } from '../../../../components/portal/AssetDownloadLink';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { DeactivateTemplateForm, ReactivateTemplateForm, DeleteTemplateForm } from './DeactivateTemplateForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export default async function AdminTemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireAdminPage();
  const { id } = await params;

  const template = await prisma.socialTemplate.findUnique({
    where: { id },
    include: {
      generatedGraphics: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { outputs: true, sourceAsset: { select: { fileName: true } }, createdBy: { select: { name: true } } },
      },
    },
  });

  if (!template) notFound();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/templates" className={styles.backLink}>← Templates</Link>

      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{template.name}</h1>
        <span className={styles.badge}>{template.category}</span>
      </div>
      {template.description && <p className={styles.subtitle}>{template.description}</p>}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Generation history</h2>
        <div className={styles.cardList}>
          {template.generatedGraphics.length === 0 && <p className={styles.cardMeta}>No graphics generated with this template yet.</p>}
          {template.generatedGraphics.map((g) => (
            <div key={g.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong>{g.sourceAsset.fileName}</strong>
                <span className={styles.cardMeta}>{g.createdBy.name} · {formatDate(g.createdAt)}</span>
              </div>
              <div className={styles.buttonRow}>
                {g.outputs.map((o) => (
                  <AssetDownloadLink key={o.id} kind="graphics" assetId={o.id} label={`${o.purpose} (${o.width}×${o.height})`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Manage</h2>
        <div className={styles.buttonRow}>
          {template.isActive ? <DeactivateTemplateForm templateId={template.id} /> : <ReactivateTemplateForm templateId={template.id} />}
          {!template.isOfficial && template.generatedGraphics.length === 0 && <DeleteTemplateForm templateId={template.id} />}
        </div>
        {template.isOfficial && <p className={styles.cardMeta}>Official templates ship with the app — deactivate rather than delete.</p>}
      </div>
    </PortalShell>
  );
}
