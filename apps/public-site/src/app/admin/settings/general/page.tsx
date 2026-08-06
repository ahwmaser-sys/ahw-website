import Link from 'next/link';
import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { getSiteUrl } from '../../../../lib/site-config';
import { getActiveBrandKit } from '../../../../lib/portal/brand-kit';
import styles from '../../../../components/portal/portal-ui.module.css';

// Deliberately read-only here — Website Domain and Legal Company Name are
// both real, database-backed, Admin-editable settings (Settings → Brand
// Kit is where they're actually edited; see WebsiteDomainForm and
// CompanyInfoForm there), kept independent per the multi-office
// architecture ("changing the domain must never rename the company").
// This page is a dashboard of the resolved values plus true build-time
// infrastructure facts — never NEXT_PUBLIC_* env vars, which would lie
// about what the running site actually uses.
export default async function AdminGeneralSettingsPage() {
  const principal = await requireAdminPage();

  const [siteUrl, kit] = await Promise.all([getSiteUrl(), getActiveBrandKit()]);
  const legalName = (kit.companyInfo as { legalName?: string } | null)?.legalName ?? 'Not set';

  const rows: { label: string; value: string; source: string }[] = [
    { label: 'Public website domain', value: siteUrl, source: 'Settings → Brand Kit → Website Domain' },
    { label: 'Legal company name', value: legalName, source: 'Settings → Brand Kit → Company Info' },
    { label: 'Environment', value: process.env.NODE_ENV ?? 'unknown', source: 'NODE_ENV (env)' },
    { label: 'Node.js runtime', value: process.version, source: 'server process' },
    { label: 'Next.js', value: '16.2.12', source: 'package.json' },
  ];

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>General</h1>
      </div>
      <p className={styles.subtitle}>
        Read-only dashboard — Website Domain and Legal Company Name are edited on the{' '}
        <Link href="/admin/brand-kit">Brand Kit</Link> page and propagate everywhere automatically (canonical URLs,
        Open Graph, QR codes, Capability Statement, emails, sitemap). Changing the domain never renames the company —
        the two are independent settings by design. The rows below are true build-time/infrastructure facts.
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Setting</th>
              <th>Value</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.value}</td>
                <td>{r.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}
