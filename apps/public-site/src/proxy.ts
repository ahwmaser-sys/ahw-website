import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from './lib/portal/db';

// Renamed from middleware.ts to proxy.ts per Next.js 16's file convention
// (middleware.ts is deprecated; proxy.ts is its stable nodejs-runtime
// replacement — see the Next.js 16 upgrade guide). The rename isn't just
// following convention for its own sake: it's what makes this file able
// to read PortalSettings from the real database directly, which
// middleware.ts's Edge-only runtime could never do — the previous
// version of this file gated /client purely on the PORTAL_ENABLED env
// var for exactly that reason. Now the owner's Settings → Client Portal
// toggle takes effect immediately, with zero .env edit or redeploy.
//
// Real, authoritative session/role verification still happens in each
// /admin and /client layout via lib/portal/auth-guard.ts — this file
// only decides whether /client is open for business at all.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/client') && pathname !== '/client/coming-soon') {
    const open = await isPortalOpen();
    if (!open) {
      const url = request.nextUrl.clone();
      url.pathname = '/client/coming-soon';
      // Rewrite, not redirect: the visible URL stays /client/whatever-was-
      // requested, so no external link to a specific /client/* path ever
      // breaks once the portal is enabled later.
      return NextResponse.rewrite(url);
    }
  }

  // /admin is intentionally NOT gated by portal settings — reachable by a
  // SUPER_ADMIN regardless, so it can be tested while the client-facing
  // portal stays hidden (brief's explicit C0 requirement). Its own
  // layout enforces the actual role check.

  return NextResponse.next();
}

async function isPortalOpen(): Promise<boolean> {
  try {
    const settings = await prisma.portalSettings.findFirst();
    if (!settings) {
      // No row yet (brand-new deployment) — fall back to the pre-seed
      // env default so a fresh deploy still boots closed without
      // requiring a database write first.
      return process.env.PORTAL_ENABLED === 'true';
    }
    return settings.enabled && !settings.maintenanceMode;
  } catch {
    // Database unreachable — fail closed. A visitor sees "Coming Soon"
    // instead of an error page, and nothing about client data is
    // exposed by a DB outage.
    return false;
  }
}

export const config = {
  matcher: ['/client/:path*', '/admin/:path*'],
};
