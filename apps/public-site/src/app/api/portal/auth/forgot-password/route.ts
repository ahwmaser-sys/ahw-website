import { randomBytes, createHash } from 'crypto';
import { z } from 'zod';
import { prisma } from '../../../../../lib/portal/db';
import { sendEmail, passwordResetEmail } from '../../../../../lib/portal/email';
import { isRateLimited } from '../../../../../lib/portal/rate-limit';
import { recordActivity, getClientIp } from '../../../../../lib/portal/audit';

const schema = z.object({ email: z.string().email() });
const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function POST(request: Request) {
  const ip = getClientIp(request) ?? 'unknown';

  if (await isRateLimited(`forgot-password:${ip}`, 5, 1000 * 60 * 15)) {
    return Response.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always the same response, whether or not the account exists — never
  // confirm or deny an email is registered.
  const genericResponse = Response.json({
    ok: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  });

  if (!user || user.status !== 'ACTIVE') {
    return genericResponse;
  }

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  const surface = user.role === 'CLIENT' ? 'client' : 'admin';
  const resetUrl = `${new URL(request.url).origin}/${surface}/reset-password/${token}`;

  await sendEmail({ to: user.email, ...passwordResetEmail(resetUrl) });

  await recordActivity({
    actorId: user.id,
    actorEmail: user.email,
    action: 'auth.password_reset_requested',
    ipAddress: ip,
  });

  return genericResponse;
}
