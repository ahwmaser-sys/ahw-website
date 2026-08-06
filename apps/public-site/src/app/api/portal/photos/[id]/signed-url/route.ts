import { requireSession, requireProjectAccess, guardErrorResponse } from '../../../../../../lib/portal/auth-guard';
import { prisma } from '../../../../../../lib/portal/db';
import { signPhotoToken } from '../../../../../../lib/portal/signed-url';

const EXPIRES_IN_SECONDS = 300;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const principal = await requireSession();
    const { id } = await params;

    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      return Response.json({ error: 'Not found.' }, { status: 404 });
    }

    await requireProjectAccess(principal, photo.projectId);

    const token = signPhotoToken(photo.id, EXPIRES_IN_SECONDS);
    return Response.json({
      url: `/api/portal/photos/download?token=${token}`,
      expiresInSeconds: EXPIRES_IN_SECONDS,
    });
  } catch (error) {
    return guardErrorResponse(error) ?? Response.json({ error: 'Server error.' }, { status: 500 });
  }
}
