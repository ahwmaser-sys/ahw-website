import { requireSession, requireProjectAccess, guardErrorResponse } from '../../../../../../lib/portal/auth-guard';
import { prisma } from '../../../../../../lib/portal/db';
import { signDocumentToken } from '../../../../../../lib/portal/signed-url';

const EXPIRES_IN_SECONDS = 300;

// Issues a short-lived signed download link for one document. This is
// where the real authorization check happens — the download route
// itself only verifies the token's signature and expiry, not project
// membership again, so this is the one place that must get it right.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const principal = await requireSession();
    const { id } = await params;

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return Response.json({ error: 'Not found.' }, { status: 404 });
    }

    await requireProjectAccess(principal, document.projectId);

    const token = signDocumentToken(document.id, EXPIRES_IN_SECONDS);
    return Response.json({
      url: `/api/portal/documents/download?token=${token}`,
      expiresInSeconds: EXPIRES_IN_SECONDS,
    });
  } catch (error) {
    return guardErrorResponse(error) ?? Response.json({ error: 'Server error.' }, { status: 500 });
  }
}
