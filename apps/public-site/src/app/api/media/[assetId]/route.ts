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
  const search = new URL(request.url).searchParams;
  // `?w=` is what ../../../image-loader.js requests for uploaded media: a
  // width-only display variant written by the media pipeline (whole image
  // scaled, never cropped). It is mapped onto the same variant lookup as
  // `?variant=`, whose purposes are the social crops.
  const requestedWidth = search.get('w');
  const variantPurpose = search.get('variant') ?? (requestedWidth ? `w${requestedWidth}` : null);

  const visible = await isPubliclyVisible(assetId);
  if (!visible) {
    return Response.json({ error: 'Not found.' }, { status: 404 });
  }

  if (variantPurpose) {
    const variant = await prisma.mediaAssetVariant.findUnique({
      where: { assetId_purpose: { assetId, purpose: variantPurpose } },
    });
    if (!variant) {
      // A width that was never generated (an older asset, or a failed
      // variant) falls through to the original below rather than 404ing --
      // the loader cannot know which widths exist for a given upload.
      if (requestedWidth) {
        const original = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
        if (original) {
          const originalData = await readFileByKey(original.storageKey);
          return new Response(new Uint8Array(originalData), {
            headers: { 'Content-Type': original.fileType, 'Cache-Control': 'public, max-age=31536000, immutable' },
          });
        }
      }
      return Response.json({ error: 'Not found.' }, { status: 404 });
    }
    const data = await readFileByKey(variant.storageKey);
    return new Response(new Uint8Array(data), {
      headers: {
        // Display widths are AVIF; the social crops are JPEG.
        'Content-Type': variant.storageKey.endsWith('.avif') ? 'image/avif' : 'image/jpeg',
        // Media is immutable: an edit replaces the reference, never the bytes.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
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
