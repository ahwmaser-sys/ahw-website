'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './PortalShell.module.css';

interface NavLink {
  href: string;
  label: string;
}
interface NavGroup {
  label: string;
  links: readonly NavLink[];
}

const COLLAPSE_KEY = 'ahw-portal-sidebar-collapsed';

// Per-viewer UI preference (collapsed/expanded), not shared state — a
// direct localStorage read/write, same fallback reasoning as any other
// per-viewer convenience: wrapped in try/catch so a private window or
// blocked site data never breaks the sidebar itself, just the
// remembered collapse state.
export function AdminSidebar({ groups }: { groups: readonly NavGroup[] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      // Ignore — defaults to expanded.
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // Ignore — the toggle still works for this page view.
      }
      return next;
    });
  };

  const isActive = (href: string) => (href === '/admin' || href === '/client' ? pathname === href : pathname === href || pathname?.startsWith(`${href}/`));

  return (
    <>
      <button
        type="button"
        className={styles.mobileNavToggle}
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
      >
        {mobileOpen ? '✕ Close menu' : '☰ Menu'}
      </button>
      {mobileOpen && <div className={styles.mobileNavScrim} onClick={() => setMobileOpen(false)} aria-hidden="true" />}
      <aside className={[styles.sidebar, collapsed ? styles.sidebarCollapsed : '', mobileOpen ? styles.sidebarMobileOpen : ''].filter(Boolean).join(' ')}>
        <button
          type="button"
          className={styles.collapseToggle}
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '»' : '«'}
        </button>
        <nav aria-label="Admin navigation" className={styles.nav}>
          {groups.map((group) => (
            <div key={group.label} className={styles.navGroup}>
              {groups.length > 1 && <span className={styles.navGroupLabel}>{group.label}</span>}
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[styles.navLink, isActive(link.href) ? styles.navLinkActive : ''].filter(Boolean).join(' ')}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
