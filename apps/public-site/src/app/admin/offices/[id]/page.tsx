import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { getSiteUrl } from '../../../../lib/site-config';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { UpdateOfficeForm, ArchiveOfficeForm, RestoreOfficeForm, DeleteOfficeForm } from './OfficeDetailForms';
import styles from '../../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminOfficeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireAdminPage();
  const { id } = await params;

  const [office, siteUrl] = await Promise.all([
    prisma.office.findUnique({ where: { id }, include: { _count: { select: { clients: true, projects: true } } } }),
    getSiteUrl(),
  ]);

  if (!office) notFound();

  const contactUrl = `${siteUrl}/contact/${office.slug}`;
  const qrSrc = `/api/portal/brand-kit/qrcode?content=${encodeURIComponent(contactUrl)}`;
  const canDelete = office._count.clients === 0 && office._count.projects === 0;

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/offices" className={styles.backLink}>← All offices</Link>

      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{office.displayName}</h1>
        <div className={styles.buttonRow}>
          {office.status === 'ARCHIVED' && <span className={`${styles.badge} ${styles.badgeMuted}`}>Archived</span>}
          {office.isHeadquarters && <span className={`${styles.badge} ${styles.badgeActive}`}>Headquarters</span>}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Office details</h2>
        <UpdateOfficeForm office={office} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Contact page &amp; QR code</h2>
        <p className={styles.cardMeta}>
          Public contact page: <a href={contactUrl} target="_blank" rel="noreferrer">{contactUrl}</a>
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- generated on demand, not a static/optimizable asset */}
        <img src={qrSrc} alt={`QR code linking to ${office.displayName}'s contact page`} className={styles.qrPreview} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Linked records</h2>
        <p className={styles.cardMeta}>{office._count.clients} client(s) · {office._count.projects} project(s)</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Manage</h2>
        {office.status === 'ARCHIVED' ? <RestoreOfficeForm officeId={office.id} /> : <ArchiveOfficeForm officeId={office.id} />}
        {canDelete && <DeleteOfficeForm officeId={office.id} />}
      </div>
    </PortalShell>
  );
}
