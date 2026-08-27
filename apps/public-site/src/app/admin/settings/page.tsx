import Link from 'next/link';
import { requireAdminPage } from '../../../lib/portal/page-guard';
import { PortalShell } from '../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../nav-links';
import styles from '../../../components/portal/portal-ui.module.css';
import hubStyles from './settings-hub.module.css';

const SECTIONS: { href: string; label: string; description: string; superAdminOnly?: boolean }[] = [
  { href: '/admin/settings/general', label: 'General', description: 'Website domain, legal company name — resolved values.' },
  { href: '/admin/brand-kit', label: 'Brand', description: 'Colors, typography, logos, CTA styles, QR style, website domain, legal name.' },
  { href: '/admin/offices', label: 'Offices', description: 'Unlimited offices — address, contact, hours, timezone, socials, QR code.' },
  { href: '/admin/settings/email', label: 'Email', description: 'Primary, secondary, careers, HR, support, sales destination inboxes.' },
  { href: '/admin/settings/seo', label: 'SEO', description: 'Default meta title suffix, robots, sitemap status.' },
  { href: '/admin/settings/legal', label: 'Legal Pages', description: 'Privacy Policy, Terms of Service, Cookie Policy, Data Deletion.', superAdminOnly: true },
  { href: '/admin/settings/security', label: 'Security', description: 'Session policy, active sessions, password requirements.' },
  { href: '/admin/settings/users', label: 'Users', description: 'Staff accounts — invite, disable, reset passwords.', superAdminOnly: true },
  { href: '/admin/settings/roles', label: 'Roles', description: 'What SUPER_ADMIN / ADMIN / EDITOR / CLIENT can each do.' },
  { href: '/admin/settings/client-portal', label: 'Client Portal', description: 'Enable, maintenance mode, invitations, support contact.', superAdminOnly: true },
  { href: '/admin/settings/integrations', label: 'Integrations', description: 'Instagram, Facebook, LinkedIn, Google services, Email.', superAdminOnly: true },
  { href: '/admin/settings/ai', label: 'AI', description: 'Connect AI providers, choose the default for the Marketing Assistant.', superAdminOnly: true },
  { href: '/admin/publishing', label: 'Publishing Destinations', description: 'Per-office, per-platform publishing participation — a Marketing setting, separate from Integrations. Not to be confused with the "Publishing" section on an individual article or landing page, which just publishes/unpublishes that one item.', superAdminOnly: true },
  { href: '/admin/analytics', label: 'Analytics', description: 'Content performance, campaign performance, media usage.' },
  { href: '/admin/settings/system', label: 'System', description: 'Live health for database, storage, and every connected service.' },
  { href: '/admin/settings/backup', label: 'Backup & Restore', description: 'Export every table as JSON, validate a backup, restore from one.', superAdminOnly: true },
];

export default async function AdminSettingsPage() {
  const principal = await requireAdminPage();
  const isSuperAdmin = principal.roles.includes('SUPER_ADMIN');

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Settings</h1>
      </div>
      <p className={styles.subtitle}>Manage the entire platform from here — day-to-day configuration with no <code>.env</code> edits.</p>

      <div className={hubStyles.grid}>
        {SECTIONS.map((section) => {
          const disabled = section.superAdminOnly && !isSuperAdmin;
          return disabled ? (
            <div key={section.label} className={`${hubStyles.card} ${hubStyles.cardDisabled}`}>
              <strong>{section.label}</strong>
              <p>{section.description}</p>
              <span className={styles.badge}>SUPER_ADMIN only</span>
            </div>
          ) : (
            <Link key={section.label} href={section.href} className={hubStyles.card}>
              <strong>{section.label}</strong>
              <p>{section.description}</p>
            </Link>
          );
        })}
      </div>
    </PortalShell>
  );
}
