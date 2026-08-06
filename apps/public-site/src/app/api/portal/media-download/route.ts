import { prisma } from '../../../../lib/portal/db';
import { verifyMediaToken, verifyVariantToken } from '../../../../lib/portal/signed-url';
import { readFileByKey } from '../../../../lib/portal/storage';

// Mirrors /api/portal/documents/download — token-only, no live session
// required, same short-lived-signed-URL model. Handles either an original
// (?token=) or a specific rendered variant (?variantToken=).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const variantToken = url.searchParams.get('variantToken');

  if (variantToken) {
    const variantId = verifyVariantToken(variantToken);
    if (!variantId) {
      return Response.json({ error: 'This link is invalid or has expired.' }, { status: 401 });
    }
    const variant = await prisma.mediaAssetVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      return Response.json({ error: 'Not found.' }, { status: 404 });
    }
    const data = await readFileByKey(variant.storageKey);
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' },
    });
  }

  if (!token) {
    return Response.json({ error: 'Missing token.' }, { status: 401 });
  }

  const assetId = verifyMediaToken(token);
  if (!assetId) {
    return Response.json({ error: 'This link is invalid or has expired.' }, { status: 401 });
  }

  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset) {
    return Response.json({ error: 'Not found.' }, { status: 404 });
  }

  const data = await readFileByKey(asset.storageKey);

  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': asset.fileType,
      'Content-Disposition': `attachment; filename="${asset.fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
