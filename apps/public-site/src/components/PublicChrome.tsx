'use client';

import { usePathname } from 'next/navigation';
import { Footer, FloatingContactHub, type Office } from '@agp/ui-components';
import { TawkChat } from './TawkChat';

// Bundles the three site-wide chrome pieces that render directly in the
// root layout (Footer, FloatingContactHub, TawkChat) so they can share
// one pathname check — same reasoning as NavigationHeader.tsx: /admin
// and /client are a separate application surface with their own
// PortalShell chrome, not the public marketing site's footer, WhatsApp
// hub, or live-chat widget. `offices` is fetched from the real database
// by the root layout (a Server Component) and passed down here, since
// this component itself is a Client Component and can't query Prisma.
export function PublicChrome({ offices, copyrightText }: { offices: readonly Office[]; copyrightText?: string | undefined }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/client')) return null;

  return (
    <>
      <Footer offices={offices} copyrightText={copyrightText} />
      <FloatingContactHub offices={offices} />
      <TawkChat />
    </>
  );
}
