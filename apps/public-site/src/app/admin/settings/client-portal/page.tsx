import { requireSuperAdminPage } from '../../../../lib/portal/page-guard';
import { prisma } from '../../../../lib/portal/db';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { PortalSettingsForm } from './PortalSettingsForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export default async function AdminClientPortalSettingsPage() {
  const principal = await requireSuperAdminPage();

  const settings = await prisma.portalSettings.findFirst();
  const logoOptions = await prisma.mediaAsset.findMany({
    where: { kind: { in: ['LOGO', 'ICON'] }, archivedAt: null },
    select: { id: true, fileName: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Client Portal</h1>
        <span className={`${styles.badge} ${settings?.enabled ? styles.badgeActive : styles.badgeMuted}`}>
          {settings?.enabled ? (settings.maintenanceMode ? 'Maintenance' : 'Live') : 'Disabled'}
        </span>
      </div>
      <p className={styles.subtitle}>
        Controls whether <code>/client</code> shows a real login or the &quot;Coming Soon&quot; page — takes effect
        immediately, no deploy needed. <code>/admin</code> is never affected by this switch.
      </p>

      <div className={styles.section}>
        <PortalSettingsForm
          settings={{
            enabled: settings?.enabled ?? false,
            maintenanceMode: settings?.maintenanceMode ?? false,
            allowInvitations: settings?.allowInvitations ?? true,
            welcomeMessage: settings?.welcomeMessage ?? null,
            portalLogoAssetId: settings?.portalLogoAssetId ?? null,
            supportEmail: settings?.supportEmail ?? null,
            supportPhone: settings?.supportPhone ?? null,
          }}
          logoOptions={logoOptions}
        />
      </div>
    </PortalShell>
  );
}
