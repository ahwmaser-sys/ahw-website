import type { ProjectSector } from './projects';

// Two-level sector taxonomy. Residential stays a flat top-level sector.
// Retail, Workplace, and Hospitality are genuinely commercial sectors by
// any normal industry definition, so they're grouped under a Commercial
// parent rather than left as three unrelated siblings competing with
// Residential for attention — this corrects a taxonomy gap (the site's
// data model was narrower than the business), it doesn't invent a claim:
// every project under Commercial is real, delivered work.
//
// This does NOT change any individual project's own `sector` field — a
// project still carries its specific sector (e.g. 'Retail'). Commercial
// is a derived grouping used for navigation and the /projects?sector=
// commercial aggregate filter, not a fourth possible project-level value.
export const COMMERCIAL_CHILD_SECTORS: ProjectSector[] = ['Retail', 'Workplace', 'Hospitality'];

export function isCommercialSector(sector: ProjectSector): boolean {
  return (COMMERCIAL_CHILD_SECTORS as string[]).includes(sector);
}
