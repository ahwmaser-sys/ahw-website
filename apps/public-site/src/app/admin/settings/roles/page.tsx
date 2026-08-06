import { requireAdminPage } from '../../../../lib/portal/page-guard';
import { PortalShell } from '../../../../components/portal/PortalShell';
import { ADMIN_NAV_LINKS } from '../../nav-links';
import styles from '../../../../components/portal/portal-ui.module.css';

// A reference page, not a permissions editor — the four roles below are
// a fixed enum enforced throughout the codebase (auth-guard.ts,
// page-guard.ts, and every 'use server' action's requireRole call), not
// database-configurable. Building a dynamic permissions engine wasn't
// asked for and would be new product scope; this documents accurately
// what already governs access today.
const ROLES: { name: string; description: string; can: string[] }[] = [
  {
    name: 'SUPER_ADMIN',
    description: 'Full access, including everything that affects the whole platform rather than one piece of content.',
    can: ['Everything ADMIN and EDITOR can do', 'Manage Settings (Integrations, AI, Client Portal, Users, Security, Backup)', 'Manage Brand Kit', 'Reset any client or staff password', 'Enable/disable any account'],
  },
  {
    name: 'ADMIN',
    description: 'Runs day-to-day client and content operations, without platform-wide configuration access.',
    can: ['Manage Clients and Projects', 'Manage Articles, Campaigns, Landing Pages, Media, Templates', 'Reset client passwords', 'Cannot edit Settings/Integrations/Brand Kit'],
  },
  {
    name: 'EDITOR',
    description: 'Content-focused — everything needed to write, publish, and generate marketing assets, nothing account-management related.',
    can: ['Manage Articles, Campaigns, Landing Pages, Media, Templates', 'Generate AI content and graphics', 'Cannot manage client accounts or passwords', 'Cannot edit Settings'],
  },
  {
    name: 'CLIENT',
    description: 'Portal-only — a client\'s own view of their own project(s), nothing from the admin panel.',
    can: ['View their project(s): progress, documents, invoices, messages', 'Manage their own notifications and password', 'No access to any other client\'s data (enforced at the query level, not just the UI)'],
  },
];

export default async function AdminRolesPage() {
  const principal = await requireAdminPage();

  return (
    <PortalShell brand="AHW Admin" navLinks={ADMIN_NAV_LINKS} userLabel={principal.roles[0] ?? ''}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Roles</h1>
      </div>
      <p className={styles.subtitle}>What each role can do — manage who holds which role from <a href="/admin/settings/users">Settings → Users</a>.</p>

      <div className={styles.cardList}>
        {ROLES.map((role) => (
          <div key={role.name} className={styles.card}>
            <strong>{role.name}</strong>
            <p className={styles.cardMeta}>{role.description}</p>
            <ul>
              {role.can.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
