import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { CreatePublicationForm } from './CreatePublicationForm';
import { ImportLegacyForms } from './ImportLegacyForms';
import styles from '../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const PAGE_SIZE = 50;

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'badgeActive',
  DRAFT: 'badgeMuted',
};

interface PublicationsPageSearchParams {
  status?: string | undefined;
  page?: string | undefined;
}

function filterLink(current: PublicationsPageSearchParams, patch: Partial<PublicationsPageSearchParams>): string {
  const merged = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== '') params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/admin/publications?${qs}` : '/admin/publications';
}

export default async function AdminPublicationsPage({ searchParams }: { searchParams: Promise<PublicationsPageSearchParams> }) {
  const principal = await requireAdminPage();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);

  const where = params.status ? { status: params.status as 'DRAFT' | 'PUBLISHED' } : {};

  const [pubs, total] = await Promise.all([
    prisma.publication.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, title: true, outlet: true, date: true, status: true },
    }),
    prisma.publication.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Publications</h1>
        <span className={styles.cardMeta}>{total} publication{total === 1 ? '' : 's'}</span>
      </div>
      <p className={styles.subtitle}>
        Press mentions of AHW at{' '}
        <a href="/insights/publications" target="_blank" rel="noreferrer">/insights/publications</a>. No code change
        needed to add or edit one.
      </p>

      <div className={styles.field}>
        <div className={styles.formRow}>
          <Link href={filterLink(params, { status: undefined, page: undefined })} className={!params.status ? styles.buttonSecondary : styles.button}>
            All
          </Link>
          <Link href={filterLink(params, { status: 'PUBLISHED', page: undefined })} className={params.status === 'PUBLISHED' ? styles.buttonSecondary : styles.button}>
            Published
          </Link>
          <Link href={filterLink(params, { status: 'DRAFT', page: undefined })} className={params.status === 'DRAFT' ? styles.buttonSecondary : styles.button}>
            Draft
          </Link>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Outlet</th>
              <th>Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pubs.length === 0 && (
              <tr className={styles.emptyRow}>
                <td colSpan={5}>No publications yet — create one below, or import from the legacy data file.</td>
              </tr>
            )}
            {pubs.map((pub) => (
              <tr key={pub.id}>
                <td>{pub.title}</td>
                <td>{pub.outlet}</td>
                <td>{pub.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td>
                  <span className={`${styles.badge} ${styles[STATUS_BADGE[pub.status] ?? 'badgeMuted']}`}>{pub.status}</span>
                </td>
                <td>
                  <Link href={`/admin/publications/${pub.id}`}>Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.buttonRow}>
          {page > 1 && (
            <Link href={filterLink(params, { page: String(page - 1) })} className={styles.buttonSecondary}>
              ← Previous
            </Link>
          )}
          <span className={styles.cardMeta}>Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={filterLink(params, { page: String(page + 1) })} className={styles.buttonSecondary}>
              Next →
            </Link>
          )}
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Create a publication</h2>
        <CreatePublicationForm />
      </div>

      {principal.roles.includes('SUPER_ADMIN') && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Import from legacy data</h2>
          <p className={styles.cardMeta}>
            One-time move of every entry from the old hardcoded data file into this admin. Safe to run more than
            once — already-imported entries are always skipped, never overwritten. Preview first to see what would
            happen.
          </p>
          <ImportLegacyForms />
        </div>
      )}
    </PortalShell>
  );
}
