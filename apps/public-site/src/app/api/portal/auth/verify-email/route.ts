import { createHash } from 'crypto';
import { z } from 'zod';
import { prisma } from '../../../../../lib/portal/db';
import { recordActivity, getClientIp } from '../../../../../lib/portal/audit';

const schema = z.object({ token: z.string().min(1) });

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
  const verification = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  const invalid = !verification || verification.usedAt || verification.expiresAt < new Date();
  if (invalid) {
    return Response.json({ error: 'This verification link is invalid or has expired.' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: verification.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailVerificationToken.update({ where: { id: verification.id }, data: { usedAt: new Date() } }),
  ]);

  await recordActivity({
    actorId: verification.userId,
    actorEmail: verification.user.email,
    action: 'auth.email_verified',
    ipAddress: getClientIp(request),
  });

  return Response.json({ ok: true });
}
