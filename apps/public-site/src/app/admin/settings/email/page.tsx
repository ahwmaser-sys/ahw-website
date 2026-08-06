import { requireSuperAdminPage } from '../../../../lib/portal/page-guard';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import { getEmailSettings } from '../../../../lib/portal/email-settings';
import { EmailSettingsForm } from './EmailSettingsForm';
import styles from '../../../../components/portal/portal-ui.module.css';

export default async function AdminEmailSettingsPage() {
  const principal = await requireSuperAdminPage();
  const settings = await getEmailSettings();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Email</h1>
      </div>
      <p className={styles.subtitle}>
        Every destination inbox this site emails to — Contact form notifications, Careers applications, and anything
        added later — reads from here, never from an <code>.env</code> file. Careers falls back to HR, then Primary,
        when left blank, so submissions always land somewhere real.
      </p>

      <div className={styles.section}>
        <EmailSettingsForm settings={settings} />
      </div>
    </PortalShell>
  );
}
