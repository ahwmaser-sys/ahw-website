import Link from 'next/link';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { listResidentialExperience } from '../../../lib/portal/residential-experience';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import styles from '../../../components/portal/portal-ui.module.css';

const CATEGORY_LABELS: Record<string, string> = {
  CURRENT_AHW_PROJECT: 'Current AHW Project',
  PREVIOUS_AHW_EXPERIENCE: 'Previous AHW / Company Experience',
  TEAM_PROFESSIONAL_EXPERIENCE: 'Team / Professional Experience',
  COLLABORATIVE_INVOLVEMENT: 'Collaborative / Professional Involvement',
  TARGET_COMMUNITY: 'Target Community',
};

interface SearchParams {
  status?: string | undefined;
  category?: string | undefined;
  region?: string | undefined;
  display?: string | undefined; // 'on' | 'off'
}

function filterLink(current: SearchParams, patch: Partial<SearchParams>): string {
  const params = new URLSearchParams();
  const merged = { ...current, ...patch };
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== '') params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/admin/residential-experience?${qs}` : '/admin/residential-experience';
}

export default async function AdminResidentialExperiencePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const principal = await requireAdminPage();
  const params = await searchParams;

  const allEntries = await listResidentialExperience();
  const regions = Array.from(new Set(allEntries.map((e) => e.region).filter((r): r is string => Boolean(r)))).sort();

  const entries = allEntries.filter((entry) => {
    if (params.status && entry.status !== params.status) return false;
    if (params.category && entry.experienceCategory !== params.category) return false;
    if (params.region && entry.region !== params.region) return false;
    if (params.display === 'on' && !entry.publicDisplay) return false;
    if (params.display === 'off' && entry.publicDisplay) return false;
    return true;
  });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Residential Experience</h1>
        <Link href="/admin/residential-experience/new" className={styles.button}>New entry</Link>
      </div>
      <p className={styles.subtitle}>
        Communities where AHW or its team has professional residential experience — feeds the public{' '}
        <Link href="/residential" target="_blank">/residential</Link> page&apos;s &quot;Selected Residential
        Experience&quot; section. Only entries with Status = Verified and Public Display = On appear there.
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Filters</h2>
        <div className={styles.buttonRow}>
          <Link href={filterLink(params, { status: undefined })} className={!params.status ? styles.button : styles.buttonSecondary}>All statuses</Link>
          <Link href={filterLink(params, { status: 'VERIFIED' })} className={params.status === 'VERIFIED' ? styles.button : styles.buttonSecondary}>Verified</Link>
          <Link href={filterLink(params, { status: 'REVIEW_REQUIRED' })} className={params.status === 'REVIEW_REQUIRED' ? styles.button : styles.buttonSecondary}>Review Required</Link>
          <Link href={filterLink(params, { status: 'TARGET' })} className={params.status === 'TARGET' ? styles.button : styles.buttonSecondary}>Target</Link>
        </div>
        <div className={styles.buttonRow}>
          <Link href={filterLink(params, { display: undefined })} className={!params.display ? styles.button : styles.buttonSecondary}>Any display</Link>
          <Link href={filterLink(params, { display: 'on' })} className={params.display === 'on' ? styles.button : styles.buttonSecondary}>Publicly displayed</Link>
          <Link href={filterLink(params, { display: 'off' })} className={params.display === 'off' ? styles.button : styles.buttonSecondary}>Not displayed</Link>
        </div>
        {regions.length > 0 && (
          <div className={styles.buttonRow}>
            <Link href={filterLink(params, { region: undefined })} className={!params.region ? styles.button : styles.buttonSecondary}>All regions</Link>
            {regions.map((region) => (
              <Link key={region} href={filterLink(params, { region })} className={params.region === region ? styles.button : styles.buttonSecondary}>{region}</Link>
            ))}
          </div>
        )}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Community</th>
              <th>Developer</th>
              <th>Region</th>
              <th>Category</th>
              <th>Status</th>
              <th>Public Display</th>
              <th>Order</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr className={styles.emptyRow}>
                <td colSpan={8}>No entries match these filters.</td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.name}{entry.archivedAt && <span className={`${styles.badge} ${styles.badgeMuted}`}> Archived</span>}</td>
                <td>{entry.developerName ? `${entry.developerName}${entry.developerVerified ? '' : ' (unverified)'}` : '—'}</td>
                <td>{entry.region ?? '—'}</td>
                <td>{CATEGORY_LABELS[entry.experienceCategory] ?? entry.experienceCategory}</td>
                <td>
                  <span className={`${styles.badge} ${entry.status === 'VERIFIED' ? styles.badgeActive : entry.status === 'TARGET' ? styles.badgeDanger : styles.badgeWarn}`}>
                    {entry.status}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${entry.publicDisplay ? styles.badgeActive : styles.badgeMuted}`}>
                    {entry.publicDisplay ? 'On' : 'Off'}
                  </span>
                </td>
                <td>{entry.displayOrder}</td>
                <td><Link href={`/admin/residential-experience/${entry.id}`}>Manage</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}
