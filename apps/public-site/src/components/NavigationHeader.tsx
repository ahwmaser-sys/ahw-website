'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@agp/ui-components';

export function NavigationHeader() {
  const pathname = usePathname();
  // /admin and /client are a separate application surface (Admin Panel /
  // Client Portal) with their own PortalShell chrome — the public
  // marketing header doesn't belong there. See PublicChrome.tsx for the
  // matching Footer/FloatingContactHub/TawkChat suppression.
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/client')) return null;
  return <Header currentPath={pathname} />;
}
