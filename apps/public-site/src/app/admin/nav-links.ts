// AI Settings and Publishing Destinations used to be their own top-level
// entries — both folded into Settings → Integrations / Settings → AI for
// the go-live pass (one place for every external-service and platform
// switch, instead of scattering them across the top nav). Brand Kit and
// Analytics stay as their own entries: high-traffic, already-established
// pages that predate the Settings Center and don't need to move.
export const ADMIN_NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/enquiries', label: 'Enquiries' },
  { href: '/admin/offices', label: 'Offices' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/news', label: 'Articles' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/campaigns', label: 'Campaigns' },
  { href: '/admin/landing-pages', label: 'Landing Pages' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/templates', label: 'Templates' },
  { href: '/admin/brand-kit', label: 'Brand Kit' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/settings', label: 'Settings' },
] as const;
