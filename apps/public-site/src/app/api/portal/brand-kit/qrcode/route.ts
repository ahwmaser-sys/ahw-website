import { requireSession, requireRole, guardErrorResponse } from '../../../../../lib/portal/auth-guard';
import { STAFF_ROLES } from '../../../../../lib/portal/roles';
import { getActiveBrandKit } from '../../../../../lib/portal/brand-kit';
import { generateQrCodeBuffer } from '../../../../../lib/portal/media/qrcode';
import { prisma } from '../../../../../lib/portal/db';
import type { BrandQrStyle, BrandLogos } from '../../../../../lib/portal/brand-kit';

// Staff-only, generated on demand rather than stored — a QR code is a pure
// function of (content, brand style), so there's nothing to persist unless
// an admin explicitly attaches one to a campaign asset later.
export async function GET(request: Request) {
  try {
    const principal = await requireSession();
    requireRole(principal, STAFF_ROLES);

    const content = new URL(request.url).searchParams.get('content');
    if (!content) {
      return Response.json({ error: 'Missing content parameter.' }, { status: 400 });
    }

    const kit = await getActiveBrandKit();
    const style = (kit.qrCodeStyle as unknown as BrandQrStyle | null) ?? { foreground: '#0F1115', background: '#F2F4F7', logoOverlay: false };
    const logos = kit.logos as unknown as BrandLogos;

    let logoStorageKey: string | null = null;
    if (style.logoOverlay && logos.icon) {
      const iconAsset = await prisma.mediaAsset.findUnique({ where: { id: logos.icon } });
      logoStorageKey = iconAsset?.storageKey ?? null;
    }

    const buffer = await generateQrCodeBuffer(content, style, logoStorageKey);

    return new Response(new Uint8Array(buffer), {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return guardErrorResponse(error) ?? Response.json({ error: 'Server error.' }, { status: 500 });
  }
}
