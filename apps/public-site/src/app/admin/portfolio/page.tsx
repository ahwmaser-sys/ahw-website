import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import { CreatePortfolioProjectForm } from './CreatePortfolioProjectForm';
import { ImportLegacyForms } from './ImportLegacyForms';
import styles from '../../../components/portal/portal-ui.module.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const PAGE_SIZE = 50;

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'badgeActive',
  DRAFT: 'badgeMuted',
};

interface PortfolioPageSearchParams {
  status?: string | undefined;
  page?: string | undefined;
}

function filterLink(current: PortfolioPageSearchParams, patch: Partial<PortfolioPageSearchParams>): string {
  const merged = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== '') params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/admin/portfolio?${qs}` : '/admin/portfolio';
}

export default async function AdminPortfolioPage({ searchParams }: { searchParams: Promise<PortfolioPageSearchParams> }) {
  const principal = await requireAdminPage();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);

  const where = params.status ? { status: params.status as 'DRAFT' | 'PUBLISHED' } : {};

  const [projects, total] = await Promise.all([
    prisma.portfolioProject.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, title: true, slug: true, sector: true, market: true, tier: true, status: true },
    }),
    prisma.portfolioProject.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Portfolio</h1>
        <span className={styles.cardMeta}>{total} project{total === 1 ? '' : 's'}</span>
      </div>
      <p className={styles.subtitle}>
        The public case-study portfolio at{' '}
        <a href="/projects" target="_blank" rel="noreferrer">/projects</a>. Every office, category, image, and story
        lives here — no code change needed to add or edit a project.
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
              <th>Project</th>
              <th>Sector</th>
              <th>Market</th>
              <th>Tier</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 && (
              <tr className={styles.emptyRow}>
                <td colSpan={6}>No projects yet — create one below, or import from the legacy data file.</td>
              </tr>
            )}
            {projects.map((project) => (
              <tr key={project.id}>
                <td>{project.title}</td>
                <td>{project.sector}</td>
                <td>{project.market}</td>
                <td>{project.tier}</td>
                <td>
                  <span className={`${styles.badge} ${styles[STATUS_BADGE[project.status] ?? 'badgeMuted']}`}>{project.status}</span>
                </td>
                <td>
                  <Link href={`/admin/portfolio/${project.id}`}>Manage</Link>
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
        <h2 className={styles.sectionTitle}>Create a project</h2>
        <CreatePortfolioProjectForm />
      </div>

      {principal.roles.includes('SUPER_ADMIN') && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Import from legacy data</h2>
          <p className={styles.cardMeta}>
            One-time move of every project from the old hardcoded data file into this admin. Safe to run more than
            once — already-imported projects are always skipped, never overwritten. Preview first to see what would
            happen.
          </p>
          <ImportLegacyForms />
        </div>
      )}
    </PortalShell>
  );
}
