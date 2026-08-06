import { z } from 'zod';
import { requireSession, requireProjectAccess, guardErrorResponse } from '../../../../../../lib/portal/auth-guard';
import { verifyCsrf } from '../../../../../../lib/portal/csrf';
import { prisma } from '../../../../../../lib/portal/db';
import { recordActivity, getClientIp } from '../../../../../../lib/portal/audit';

const messageSchema = z.object({ body: z.string().min(1).max(5000) });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const principal = await requireSession();
    const { id } = await params;
    await requireProjectAccess(principal, id);

    const messages = await prisma.message.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { name: true, role: true } } },
    });

    return Response.json({ messages });
  } catch (error) {
    return guardErrorResponse(error) ?? Response.json({ error: 'Server error.' }, { status: 500 });
  }
}

// The state-changing endpoint used to prove CSRF protection actually
// works, not just that verifyCsrf() exists — see /PORTAL-IMPLEMENTATION.md
// for the real attempt-and-observe result.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const principal = await requireSession();
    const { id } = await params;
    await requireProjectAccess(principal, id);

    if (!(await verifyCsrf(request))) {
      return Response.json({ error: 'Invalid or missing CSRF token.' }, { status: 403 });
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: { projectId: id, senderId: principal.userId, body: parsed.data.body },
    });

    await recordActivity({
      actorId: principal.userId,
      action: 'project.message_sent',
      entityType: 'Message',
      entityId: message.id,
      projectId: id,
      ipAddress: getClientIp(request),
    });

    return Response.json({ message }, { status: 201 });
  } catch (error) {
    return guardErrorResponse(error) ?? Response.json({ error: 'Server error.' }, { status: 500 });
  }
}
