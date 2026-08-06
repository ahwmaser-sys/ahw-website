import { prisma } from '../../../../lib/portal/db';
import { readFileByKey } from '../../../../lib/portal/storage';
import { isPubliclyVisible } from '../../../../lib/portal/media/public-visibility';

// Deliberately unsigned and unauthenticated — this is the public-facing
// half of the Media Library. Everything else in this app (client
// documents, admin-only asset browsing) uses short-lived signed tokens
// because it's meant to stay private; this route exists because a
// published Article's featured image needs a stable, publicly-fetchable
// URL for <Image> tags, Open Graph, and RSS the same way any other public
// site image does. The privacy boundary here is enforced by checking
// "is this asset actually referenced by something currently published"
// on every request (isPubliclyVisible, shared with social dispatch —
// same reasoning applies to what an outbound Instagram/Facebook/etc.
// post is allowed to link to), not by the URL being hard to guess.

export async function GET(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const variantPurpose = new URL(request.url).searchParams.get('variant');

  const visible = await isPubliclyVisible(assetId);
  if (!visible) {
    return Response.json({ error: 'Not found.' }, { status: 404 });
  }

  if (variantPurpose) {
    const variant = await prisma.mediaAssetVariant.findUnique({
      where: { assetId_purpose: { assetId, purpose: variantPurpose } },
    });
    if (!variant) {
      return Response.json({ error: 'Not found.' }, { status: 404 });
    }
    const data = await readFileByKey(variant.storageKey);
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600' },
    });
  }

  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset) {
    return Response.json({ error: 'Not found.' }, { status: 404 });
  }
  const data = await readFileByKey(asset.storageKey);
  return new Response(new Uint8Array(data), {
    headers: { 'Content-Type': asset.fileType, 'Cache-Control': 'public, max-age=3600' },
  });
}
