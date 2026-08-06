import type { Metadata } from 'next';

// Applies to every /admin page, including /admin/login. Does NOT perform
// the auth check itself (that would make /admin/login unreachable while
// logged out) — each protected page calls requireAdminPage() /
// requireSuperAdminPage() individually. See /PORTAL-PLAN.md §4/§5.
export const metadata: Metadata = {
  title: { template: '%s | AHW Admin', default: 'AHW Admin' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
