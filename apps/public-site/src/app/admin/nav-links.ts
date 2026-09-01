// AI Settings moved into Settings → AI for the go-live pass (one place
// for every external-service and platform switch, instead of scattering
// them across the top nav). Publishing Destinations stayed a top-level
// concern in practice (linked from the Settings hub's own grid at
// /admin/settings, not actually nested under Integrations the way this
// comment used to claim) — corrected here rather than left silently
// wrong. Brand Kit and Analytics stay as their own entries: high-traffic,
// already-established pages that predate the Settings Center and don't
// need to move.
//
// "Content Campaigns" and "Ad Campaigns" are two genuinely different
// things that both used to share the plain label "Campaigns" — the
// former groups articles/social posts/landing pages, the latter is the
// real paid-media record synced from Google/Meta/LinkedIn/TikTok. Ad
// Campaigns previously had no top-level nav entry at all (only a button
// on the Ads page itself), which is what made a click on "Campaigns"
// land on the wrong one.
//
// Grouped (rather than one flat 18-item row) so the sidebar can render
// real sections instead of a wrapping wall of links — same routes as
// before, just organized. PortalShell renders whatever groups it's
// given, so this is the only file that needs to change to add, remove,
// or regroup a page; every admin page just passes ADMIN_NAV_LINKS
// straight through.
export interface AdminNavLink {
  href: string;
  label: string;
}

export interface AdminNavGroup {
  label: string;
  links: readonly AdminNavLink[];
}

export const ADMIN_NAV_LINKS: readonly AdminNavGroup[] = [
  {
    label: 'Overview',
    links: [
      { href: '/admin', label: 'Dashboard' },
      { href: '/admin/activity', label: 'Activity' },
    ],
  },
  {
    label: 'Business',
    links: [
      { href: '/admin/enquiries', label: 'Enquiries' },
      { href: '/admin/offices', label: 'Offices' },
      { href: '/admin/clients', label: 'Clients' },
      { href: '/admin/reviews', label: 'Reviews' },
      { href: '/admin/messages', label: 'Messages' },
    ],
  },
  {
    label: 'Projects & Content',
    links: [
      { href: '/admin/projects', label: 'Projects' },
      { href: '/admin/residential-experience', label: 'Residential Experience' },
      { href: '/admin/news', label: 'Articles' },
      { href: '/admin/media', label: 'Media' },
    ],
  },
  {
    label: 'Marketing',
    links: [
      { href: '/admin/campaigns', label: 'Content Campaigns' },
      { href: '/admin/landing-pages', label: 'Landing Pages' },
      { href: '/admin/ads', label: 'Ads' },
      { href: '/admin/ads/campaigns', label: 'Ad Campaigns' },
      { href: '/admin/social-feed', label: 'Social Feed' },
      { href: '/admin/analytics', label: 'Analytics' },
    ],
  },
  {
    label: 'Brand & System',
    links: [
      { href: '/admin/templates', label: 'Templates' },
      { href: '/admin/brand-kit', label: 'Brand Kit' },
      { href: '/admin/settings', label: 'Settings' },
    ],
  },
] as const;
