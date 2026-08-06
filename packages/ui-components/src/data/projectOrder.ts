import type { ProjectMetadata } from './projects';

// Explicit, intentional display order for the Projects index — never the
// incidental order projects happen to be declared in projects.ts (which
// reflects whenever each project was added to the file, not editorial
// intent), never a raw date sort (several projects carry a 'TBD' or
// future year for in-progress work, which sorts meaninglessly on its
// own), and never array position.
//
// Rule, stated plainly so it's auditable rather than a black box:
// Flagship-tier projects first (the firm's own existing "this is our
// best work" signal — reinforces strongest work per the brief), then
// Standard-tier; alphabetical by title within each tier as a stable,
// fully deterministic tie-breaker. Verified against the live data file
// slug-by-slug before being written here — every slug below is real,
// resolves to exactly one project, and every project appears exactly
// once (see RC-REPORT.md Section 3 for the verification method).
export const PROJECT_DISPLAY_ORDER: string[] = [
  // Flagship (alphabetical)
  'aurea-social-house-new-capital-egypt',
  'beit-al-watan-residential-new-cairo-egypt',
  'fintas-apartment-kuwait',
  'il-bosco-villa-new-capital-egypt',
  'khiran-chalet-kuwait',
  'aliaa-behbehani-lawyer-office-bneid-al-gar',
  'sultan-center-hawally-kuwait',
  'surra-villa-kuwait',
  // Standard (alphabetical)
  'ahw-architects-hq-maadi-egypt',
  'khawaneej-courtyard-villa-dubai',
  'giorgio-di-mare-avenues-kuwait',
  'jabriya-apartment-kuwait',
  'kai-sokhna-egypt',
  'new-brew-coffee-salmiya-kuwait',
  'nozha-private-villa-kuwait',
  'samsung-store-nasr-city-egypt',
  'shrouk-city-apartment-egypt',
  'stone-park-landscape-new-cairo',
  'stone-residence-new-cairo-egypt',
  'tmreya-cafe-kout-mall-kuwait',
];

// Any project not listed above (e.g. one added later, before this list is
// updated) sorts after everything that is — visible/reachable, never
// silently dropped, but never allowed to land ahead of the deliberate
// order by accident either.
export function sortByDisplayOrder<T extends Pick<ProjectMetadata, 'slug'>>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ai = PROJECT_DISPLAY_ORDER.indexOf(a.slug);
    const bi = PROJECT_DISPLAY_ORDER.indexOf(b.slug);
    const aRank = ai === -1 ? PROJECT_DISPLAY_ORDER.length : ai;
    const bRank = bi === -1 ? PROJECT_DISPLAY_ORDER.length : bi;
    return aRank - bRank;
  });
}
