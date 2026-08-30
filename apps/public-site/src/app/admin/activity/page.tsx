import Link from 'next/link';
import { requireSuperAdminPage } from '../../../lib/portal/page-guard';
import { prisma } from '../../../lib/portal/db';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import styles from '../../../components/portal/portal-ui.module.css';

const PAGE_SIZE = 50;

interface ActivityPageSearchParams {
  entityType?: string | undefined;
  action?: string | undefined;
  page?: string | undefined;
}

// Same real ActivityLog table every admin mutation already writes to
// (see integrations/logs/page.tsx, the narrower existing viewer this
// generalizes) — not a new tracking mechanism, just the first place an
// admin can browse it across every entity type instead of one at a
// time. Restricted to SUPER_ADMIN: rows can include IP addresses and
// other actors' emails, the same sensitivity bar as Office legal info.
function filterLink(current: ActivityPageSearchParams, patch: Partial<ActivityPageSearchParams>): string {
  const merged = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== '') params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/admin/activity?${qs}` : '/admin/activity';
}

export default async function AdminActivityPage({ searchParams }: { searchParams: Promise<ActivityPageSearchParams> }) {
  const principal = await requireSuperAdminPage();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);

  const where = {
    ...(params.entityType ? { entityType: params.entityType } : {}),
    ...(params.action ? { action: { contains: params.action, mode: 'insensitive' as const } } : {}),
  };

  const [logs, total, entityTypes] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.activityLog.count({ where }),
    // Real distinct values already in the table — the filter dropdown
    // only ever offers entity types that actually have logged activity.
    prisma.activityLog.findMany({
      distinct: ['entityType'],
      select: { entityType: true },
      where: { entityType: { not: null } },
      orderBy: { entityType: 'asc' },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Activity</h1>
        <span className={styles.cardMeta}>{total} record{total === 1 ? '' : 's'}</span>
      </div>

      <div className={styles.field}>
        <div className={styles.formRow}>
          <Link href={filterLink(params, { entityType: undefined, page: undefined })} className={!params.entityType ? styles.buttonSecondary : styles.button}>
            All types
          </Link>
          {entityTypes.map((row) =>
            row.entityType ? (
              <Link
                key={row.entityType}
                href={filterLink(params, { entityType: row.entityType, page: undefined })}
                className={params.entityType === row.entityType ? styles.buttonSecondary : styles.button}
              >
                {row.entityType}
              </Link>
            ) : null,
          )}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr className={styles.emptyRow}>
                <td colSpan={5}>No activity recorded{params.entityType || params.action ? ' for this filter' : ' yet'}.</td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.createdAt.toLocaleString()}</td>
                <td>{log.action}</td>
                <td>{log.actorEmail ?? '—'}</td>
                <td>{log.entityType ? `${log.entityType}${log.entityId ? ` · ${log.entityId}` : ''}` : '—'}</td>
                <td>{log.metadata ?? '—'}</td>
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
          <span className={styles.cardMeta}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={filterLink(params, { page: String(page + 1) })} className={styles.buttonSecondary}>
              Next →
            </Link>
          )}
        </div>
      )}
    </PortalShell>
  );
}
