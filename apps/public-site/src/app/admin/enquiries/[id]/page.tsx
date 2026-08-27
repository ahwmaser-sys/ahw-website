import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { StatusForm } from '../StatusForm';
import { ArchiveEnquiryForm, RestoreEnquiryForm, DeleteEnquiryForm } from './EnquiryDetailForms';
import styles from '../../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export default async function AdminEnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireAdminPage();
  const { id } = await params;

  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) notFound();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <Link href="/admin/enquiries" className={styles.backLink}>← All enquiries</Link>

      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{enquiry.name}{enquiry.company ? ` (${enquiry.company})` : ''}</h1>
        {enquiry.archivedAt && <span className={`${styles.badge} ${styles.badgeMuted}`}>Archived</span>}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Message</h2>
        <p className={styles.cardMeta}>{enquiry.message}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Contact details</h2>
        <p className={styles.cardMeta}>
          Email: <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a><br />
          Phone: <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a><br />
          Country: {enquiry.country}<br />
          Office: {enquiry.office}
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Project</h2>
        <p className={styles.cardMeta}>
          Type: {enquiry.projectType}<br />
          {enquiry.budget && <>Budget: {enquiry.budget}<br /></>}
          Timeline: {enquiry.timeline}
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Attribution</h2>
        <p className={styles.cardMeta}>
          {enquiry.utmSource ? `${enquiry.utmSource} / ${enquiry.utmMedium ?? '—'}` : 'No UTM recorded'}
          {enquiry.utmCampaign && <><br />Campaign: {enquiry.utmCampaign}</>}
          {enquiry.gclid && <><br />Google Ads click (gclid present)</>}
          {enquiry.fbclid && <><br />Meta Ads click (fbclid present)</>}
          {enquiry.ttclid && <><br />TikTok Ads click (ttclid present)</>}
          {enquiry.landingPath && <><br />Landing page: {enquiry.landingPath}</>}
          {enquiry.referrer && <><br />Referrer: {enquiry.referrer}</>}
          <br />Received: {formatDate(enquiry.createdAt)}
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Status</h2>
        <StatusForm enquiryId={enquiry.id} status={enquiry.status} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Manage</h2>
        {enquiry.archivedAt ? <RestoreEnquiryForm enquiryId={enquiry.id} /> : <ArchiveEnquiryForm enquiryId={enquiry.id} />}
        <DeleteEnquiryForm enquiryId={enquiry.id} />
      </div>
    </PortalShell>
  );
}
