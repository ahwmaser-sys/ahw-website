// Wrapped in a single group so it fits PortalShell's grouped-sidebar
// shape (shared with /admin) without PortalShell needing two different
// prop types — a single-group sidebar just renders without a group
// label (see PortalShell.tsx).
export const CLIENT_NAV_LINKS = [
  {
    label: 'Menu',
    links: [
      { href: '/client', label: 'Dashboard' },
      { href: '/client/notifications', label: 'Notifications' },
      { href: '/client/profile', label: 'Profile' },
    ],
  },
] as const;
