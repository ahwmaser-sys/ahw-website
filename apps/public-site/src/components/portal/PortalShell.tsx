import { LogoutButton } from './LogoutButton';
import { AdminSidebar } from './AdminSidebar';
import styles from './PortalShell.module.css';

interface NavLink {
  href: string;
  label: string;
}
interface NavGroup {
  label: string;
  links: readonly NavLink[];
}

interface PortalShellProps {
  brand: string;
  navLinks: readonly NavGroup[];
  userLabel: string;
  children: React.ReactNode;
}

// Shared chrome for every authenticated /admin and /client page — reuses
// the site's own tokens (ink/paper/stone, Inter/Outfit) rather than
// introducing a second design language, per the brief's explicit
// requirement for both the Admin Panel and Client Portal. Sidebar
// navigation (grouped, collapsible, active-route-aware) lives in
// AdminSidebar — the one client-side island this shell needs; the shell
// itself stays a Server Component.
export function PortalShell({ brand, navLinks, userLabel, children }: PortalShellProps) {
  return (
    <div className={styles.shell}>
      <AdminSidebar groups={navLinks} />
      <div className={styles.main}>
        <header className={styles.header}>
          <span className={styles.brand}>{brand}</span>
          <div className={styles.userArea}>
            <span className={styles.userLabel}>{userLabel}</span>
            <LogoutButton />
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
