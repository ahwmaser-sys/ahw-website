import { requireSession, requireRole, guardErrorResponse } from '../../../../../../lib/portal/auth-guard';
import { STAFF_ROLES } from '../../../../../../lib/portal/roles';
import { prisma } from '../../../../../../lib/portal/db';
import { signGraphicOutputToken } from '../../../../../../lib/portal/signed-url';

const EXPIRES_IN_SECONDS = 300;

export async function GET(_request: Request, { params }: { params: Promise<{ outputId: string }> }) {
  try {
    const principal = await requireSession();
    requireRole(principal, STAFF_ROLES);
    const { outputId } = await params;

    const output = await prisma.generatedGraphicOutput.findUnique({ where: { id: outputId } });
    if (!output) {
      return Response.json({ error: 'Not found.' }, { status: 404 });
    }

    const token = signGraphicOutputToken(output.id, EXPIRES_IN_SECONDS);
    return Response.json({
      url: `/api/portal/graphics-download?token=${token}`,
      expiresInSeconds: EXPIRES_IN_SECONDS,
    });
  } catch (error) {
    return guardErrorResponse(error) ?? Response.json({ error: 'Server error.' }, { status: 500 });
  }
}
