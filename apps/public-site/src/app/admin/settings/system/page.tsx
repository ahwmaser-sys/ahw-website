import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { runHealthChecks } from '../../../../lib/portal/system-health';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import styles from '../../../../components/portal/portal-ui.module.css';

export default async function AdminSystemHealthPage() {
  const principal = await requireAdminPage();
  const checks = await runHealthChecks();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>System Health</h1>
      </div>
      <p className={styles.subtitle}>Real-time checks, run on every page load — nothing here is cached or simulated.</p>

      <div className={styles.cardList}>
        {checks.map((check) => (
          <div key={check.name} className={styles.card}>
            <div className={styles.cardHeader}>
              <strong>{check.name}</strong>
              <span
                className={`${styles.badge} ${
                  check.status === 'HEALTHY' ? styles.badgeActive : check.status === 'WARNING' ? styles.badgeWarn : styles.badgeDanger
                }`}
              >
                {check.status === 'HEALTHY' ? 'Healthy' : check.status === 'WARNING' ? 'Warning' : 'Offline'}
              </span>
            </div>
            <p className={styles.cardMeta}>{check.detail}</p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
