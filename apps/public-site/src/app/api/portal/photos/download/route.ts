import { prisma } from '../../../../../lib/portal/db';
import { verifyPhotoToken } from '../../../../../lib/portal/signed-url';
import { readFileByKey } from '../../../../../lib/portal/storage';

// Mirrors /api/portal/documents/download — see that file's comment for
// why this is deliberately token-only, not session-gated.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) {
    return Response.json({ error: 'Missing token.' }, { status: 401 });
  }

  const photoId = verifyPhotoToken(token);
  if (!photoId) {
    return Response.json({ error: 'This link is invalid or has expired.' }, { status: 401 });
  }

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) {
    return Response.json({ error: 'Not found.' }, { status: 404 });
  }

  const data = await readFileByKey(photo.storageKey);

  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'no-store',
    },
  });
}
