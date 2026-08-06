// Shared role groups for server actions and route handlers that don't
// already have their own local copy (auth-guard.ts and page-guard.ts
// keep their own inline copies — left as-is to avoid touching already
// -verified C2/C3 code).
export const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] as const;
export const SUPER_ADMIN_ONLY = ['SUPER_ADMIN'] as const;
// Per /PORTAL-PLAN.md §5's role matrix: EDITOR can manage project
// content (uploads, updates, news) but not client accounts or
// passwords — that stays SUPER_ADMIN/ADMIN only.
export const CLIENT_MANAGEMENT_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;
