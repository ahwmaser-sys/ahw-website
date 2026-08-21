import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { StatusForm } from './StatusForm';
import styles from '../../../components/portal/portal-ui.module.css';

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

// Best-effort human label from whatever attribution actually got
// captured (see features/contact/lib/attribution.ts) — a click-id alone
// (no utm_source) still means "came from a paid ad," so it's checked
// even when utmSource is empty, rather than only trusting utm_source.
function attributionLabel(e: { utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; gclid: string | null; fbclid: string | null; ttclid: string | null }): string {
  if (e.utmSource) return [e.utmSource, e.utmMedium].filter(Boolean).join(' / ');
  if (e.gclid) return 'Google Ads (gclid)';
  if (e.fbclid) return 'Meta Ads (fbclid)';
  if (e.ttclid) return 'TikTok Ads (ttclid)';
  return 'Direct / organic';
}

// The public contact form's leads (/api/contact) — a different concept
// from Messages (project chat threads between staff and an existing
// client). This is the top of the funnel: anyone who submitted the
// contact form, before they're a Client or Project at all.
export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const principal = await requireAdminPage();
  const { status } = await searchParams;

  const enquiries = await prisma.enquiry.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Enquiries</h1>
      </div>
      <p className={styles.subtitle}>Every contact-form submission, saved here in addition to the email notification the office already receives.</p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Office</th>
              <th>Project type</th>
              <th>Email</th>
              <th>Source</th>
              <th>Received</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.length === 0 && (
              <tr className={styles.emptyRow}>
                <td colSpan={7}>No enquiries yet.</td>
              </tr>
            )}
            {enquiries.map((e) => (
              <tr key={e.id}>
                <td>{e.name}{e.company ? ` (${e.company})` : ''}</td>
                <td>{e.office}</td>
                <td>{e.projectType}</td>
                <td><a href={`mailto:${e.email}`}>{e.email}</a></td>
                <td>
                  {attributionLabel(e)}
                  {e.utmCampaign && <div className={styles.captionText}>{e.utmCampaign}</div>}
                </td>
                <td>{formatDate(e.createdAt)}</td>
                <td><StatusForm enquiryId={e.id} status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}
