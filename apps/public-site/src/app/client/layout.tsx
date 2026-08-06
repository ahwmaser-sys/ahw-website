import type { Metadata } from 'next';

// Mirrors admin/layout.tsx — applies to every /client page including
// /client/login, without performing the auth check itself (each
// protected page calls requireClientPage() individually).
export const metadata: Metadata = {
  title: { template: '%s | AHW Client Portal', default: 'AHW Client Portal' },
  robots: { index: false, follow: false },
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return children;
}
