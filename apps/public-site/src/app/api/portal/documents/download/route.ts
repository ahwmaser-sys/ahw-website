import { prisma } from '../../../../../lib/portal/db';
import { verifyDocumentToken } from '../../../../../lib/portal/signed-url';
import { readFileByKey } from '../../../../../lib/portal/storage';

// Deliberately NOT session-gated — the signed token from
// /api/portal/documents/[id]/signed-url is the entire authorization
// proof here, scoped to one document and expiring in minutes. This is
// the "authenticated endpoint with short-lived signed URL" the brief
// requires, not a permanent direct file path: the storageKey on disk is
// never exposed to the client, only ever resolved server-side by id.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) {
    return Response.json({ error: 'Missing token.' }, { status: 401 });
  }

  const documentId = verifyDocumentToken(token);
  if (!documentId) {
    return Response.json({ error: 'This link is invalid or has expired.' }, { status: 401 });
  }

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) {
    return Response.json({ error: 'Not found.' }, { status: 404 });
  }

  const data = await readFileByKey(document.storageKey);

  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': document.fileType,
      'Content-Disposition': `attachment; filename="${document.fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
