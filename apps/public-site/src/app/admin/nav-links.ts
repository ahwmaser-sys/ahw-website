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
export const ADMIN_NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/enquiries', label: 'Enquiries' },
  { href: '/admin/offices', label: 'Offices' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/news', label: 'Articles' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/residential-experience', label: 'Residential Experience' },
  { href: '/admin/campaigns', label: 'Content Campaigns' },
  { href: '/admin/landing-pages', label: 'Landing Pages' },
  { href: '/admin/ads', label: 'Ads' },
  { href: '/admin/ads/campaigns', label: 'Ad Campaigns' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/templates', label: 'Templates' },
  { href: '/admin/brand-kit', label: 'Brand Kit' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/settings', label: 'Settings' },
] as const;
