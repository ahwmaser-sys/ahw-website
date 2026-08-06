import { redirect } from 'next/navigation';
import { getPrincipal, type Principal } from './session';

// Page-component counterpart to auth-guard.ts's requireSession/requireRole
// (those throw JSON-friendly errors for API routes; these redirect, for
// Server Component pages). Every protected /admin and /client page calls
// one of these at the top, rather than relying on a single shared layout
// to catch everything — explicit per-page checks so a new page is secure
// by construction, not by inheriting a boundary correctly.
const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR'];

export async function requireAdminPage(): Promise<Principal> {
  const principal = await getPrincipal();
  if (!principal || !principal.roles.some((r) => STAFF_ROLES.includes(r))) {
    redirect('/admin/login');
  }
  return principal;
}

export async function requireSuperAdminPage(): Promise<Principal> {
  const principal = await getPrincipal();
  if (!principal || !principal.roles.includes('SUPER_ADMIN')) {
    redirect('/admin/login');
  }
  return principal;
}

export async function requireClientPage(): Promise<Principal> {
  const principal = await getPrincipal();
  if (!principal || !principal.roles.includes('CLIENT')) {
    redirect('/client/login');
  }
  return principal;
}
