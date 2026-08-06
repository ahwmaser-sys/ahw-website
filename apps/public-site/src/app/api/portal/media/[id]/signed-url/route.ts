import { requireSession, requireRole, guardErrorResponse } from '../../../../../../lib/portal/auth-guard';
import { STAFF_ROLES } from '../../../../../../lib/portal/roles';
import { prisma } from '../../../../../../lib/portal/db';
import { signMediaToken, signVariantToken } from '../../../../../../lib/portal/signed-url';

const EXPIRES_IN_SECONDS = 300;

// Staff-only access to a Media Library original or a specific variant
// (?purpose=instagram-portrait) — browsing/managing the DAM itself,
// including previewing assets that aren't attached to any published
// content yet. Published content images are served separately and
// unsigned via /api/media/[assetId] — see that route for why.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const principal = await requireSession();
    requireRole(principal, STAFF_ROLES);
    const { id } = await params;
    const purpose = new URL(request.url).searchParams.get('purpose');

    if (purpose) {
      const variant = await prisma.mediaAssetVariant.findUnique({
        where: { assetId_purpose: { assetId: id, purpose } },
      });
      if (!variant) {
        return Response.json({ error: 'Not found.' }, { status: 404 });
      }
      const token = signVariantToken(variant.id, EXPIRES_IN_SECONDS);
      return Response.json({
        url: `/api/portal/media-download?variantToken=${token}`,
        expiresInSeconds: EXPIRES_IN_SECONDS,
      });
    }

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      return Response.json({ error: 'Not found.' }, { status: 404 });
    }

    const token = signMediaToken(asset.id, EXPIRES_IN_SECONDS);
    return Response.json({
      url: `/api/portal/media-download?token=${token}`,
      expiresInSeconds: EXPIRES_IN_SECONDS,
    });
  } catch (error) {
    return guardErrorResponse(error) ?? Response.json({ error: 'Server error.' }, { status: 500 });
  }
}
