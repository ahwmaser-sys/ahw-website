import Link from 'next/link';
import { LogoutButton } from './LogoutButton';
import styles from './PortalShell.module.css';

interface NavLink {
  href: string;
  label: string;
}

interface PortalShellProps {
  brand: string;
  navLinks: readonly NavLink[];
  userLabel: string;
  children: React.ReactNode;
}

// Shared chrome for every authenticated /admin and /client page — reuses
// the site's own tokens (ink/paper/stone, Inter/Outfit) rather than
// introducing a second design language, per the brief's explicit
// requirement for both the Admin Panel and Client Portal.
export function PortalShell({ brand, navLinks, userLabel, children }: PortalShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>{brand}</span>
        <nav className={styles.nav} aria-label="Portal navigation">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={styles.userArea}>
          <span className={styles.userLabel}>{userLabel}</span>
          <LogoutButton />
        </div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
