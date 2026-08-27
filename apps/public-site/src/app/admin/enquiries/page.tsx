import Link from 'next/link';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
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

interface EnquiriesPageSearchParams {
  status?: string | undefined;
  archived?: string | undefined;
}

// Consistent with the rest of Admin's server-rendered filter pattern
// (see /admin/reviews) — every filter click is a real navigation to a
// new URL, nothing client-side to keep in sync.
function filterLink(base: string, current: EnquiriesPageSearchParams, patch: Partial<EnquiriesPageSearchParams>): string {
  const params = new URLSearchParams();
  const merged = { ...current, ...patch };
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== '') params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// The public contact form's leads (/api/contact) — a different concept
// from Messages (project chat threads between staff and an existing
// client). This is the top of the funnel: anyone who submitted the
// contact form, before they're a Client or Project at all.
export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<EnquiriesPageSearchParams> }) {
  const principal = await requireAdminPage();
  const params = await searchParams;
  const showArchived = params.archived === '1';

  const enquiries = await prisma.enquiry.findMany({
    where: {
      archivedAt: showArchived ? { not: null } : null,
      ...(params.status ? { status: params.status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Enquiries</h1>
        <Link href={filterLink('/admin/enquiries', params, { archived: showArchived ? undefined : '1' })} className={styles.linkButton}>
          {showArchived ? '← Back to enquiries' : 'View archived'}
        </Link>
      </div>
      <p className={styles.subtitle}>Every contact-form submission, saved here in addition to the email notification the office already receives.</p>

      {!showArchived && (
        <div className={styles.buttonRow} style={{ marginBottom: 'var(--space-4)' }}>
          <Link href={filterLink('/admin/enquiries', params, { status: undefined })} className={!params.status ? styles.button : styles.buttonSecondary}>All</Link>
          <Link href={filterLink('/admin/enquiries', params, { status: 'New' })} className={params.status === 'New' ? styles.button : styles.buttonSecondary}>New</Link>
          <Link href={filterLink('/admin/enquiries', params, { status: 'Contacted' })} className={params.status === 'Contacted' ? styles.button : styles.buttonSecondary}>Contacted</Link>
          <Link href={filterLink('/admin/enquiries', params, { status: 'Closed' })} className={params.status === 'Closed' ? styles.button : styles.buttonSecondary}>Closed</Link>
        </div>
      )}

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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {enquiries.length === 0 && (
              <tr className={styles.emptyRow}>
                <td colSpan={8}>{showArchived ? 'No archived enquiries.' : 'No enquiries yet.'}</td>
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
                <td><span className={styles.badge}>{e.status}</span></td>
                <td><Link href={`/admin/enquiries/${e.id}`}>Manage</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}
