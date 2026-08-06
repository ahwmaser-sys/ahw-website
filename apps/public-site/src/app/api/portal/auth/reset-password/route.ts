import { createHash } from 'crypto';
import { z } from 'zod';
import { prisma } from '../../../../../lib/portal/db';
import { hashPassword } from '../../../../../lib/portal/password';
import { isRateLimited } from '../../../../../lib/portal/rate-limit';
import { recordActivity, getClientIp } from '../../../../../lib/portal/audit';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(10, 'Password must be at least 10 characters.'),
});

export async function POST(request: Request) {
  const ip = getClientIp(request) ?? 'unknown';

  if (await isRateLimited(`reset-password:${ip}`, 10, 1000 * 60 * 15)) {
    return Response.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  }

  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  // Single-use: already-used or expired tokens fail identically to a
  // nonexistent one — no information leak about which case applies.
  const invalid = !resetToken || resetToken.usedAt || resetToken.expiresAt < new Date();
  if (invalid) {
    return Response.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    // Invalidate every existing session on password change — a stolen
    // session shouldn't survive the account owner resetting their password.
    prisma.session.deleteMany({ where: { userId: resetToken.userId } }),
  ]);

  await recordActivity({
    actorId: resetToken.userId,
    actorEmail: resetToken.user.email,
    action: 'auth.password_reset_completed',
    ipAddress: ip,
  });

  return Response.json({ ok: true });
}
