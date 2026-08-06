import { z } from 'zod';
import { prisma } from '../../../../../lib/portal/db';
import { verifyPassword } from '../../../../../lib/portal/password';
import { createSession } from '../../../../../lib/portal/session';
import { isRateLimited } from '../../../../../lib/portal/rate-limit';
import { recordActivity, getClientIp } from '../../../../../lib/portal/audit';
import { issueCsrfToken } from '../../../../../lib/portal/csrf';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  // Which login surface this came from — enforced below so a CLIENT
  // credential can't be used at /admin/login or vice versa, even though
  // both hit the same endpoint.
  surface: z.enum(['admin', 'client']),
});

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR'];
const GENERIC_ERROR = 'Invalid email or password.';

export async function POST(request: Request) {
  const ip = getClientIp(request) ?? 'unknown';

  if (await isRateLimited(`login:${ip}`, 10, 1000 * 60 * 15)) {
    return Response.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: GENERIC_ERROR }, { status: 400 });
  }
  const { email, password, surface } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Same generic response whether the email doesn't exist, the password
  // is wrong, the account is disabled, or the realm doesn't match the
  // surface — never a distinguishing message (brief's explicit C2
  // requirement).
  const fail = async (reason: string) => {
    await recordActivity({
      actorEmail: email,
      action: 'auth.login_failed',
      metadata: { reason, surface },
      ipAddress: ip,
    });
    return Response.json({ error: GENERIC_ERROR }, { status: 401 });
  };

  if (!user) return fail('no_such_user');
  if (user.status !== 'ACTIVE') return fail('disabled');

  const isStaff = STAFF_ROLES.includes(user.role);
  if (surface === 'admin' && !isStaff) return fail('wrong_surface');
  if (surface === 'client' && user.role !== 'CLIENT') return fail('wrong_surface');

  const validPassword = await verifyPassword(user.passwordHash, password);
  if (!validPassword) return fail('bad_password');

  await createSession(user.id, user.role, {
    ipAddress: ip,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });
  // Issued alongside the session so the client has a matching
  // double-submit CSRF cookie from the moment they're authenticated,
  // without a separate round-trip.
  await issueCsrfToken();

  await recordActivity({
    actorId: user.id,
    actorEmail: user.email,
    action: 'auth.login',
    metadata: { surface },
    ipAddress: ip,
  });

  return Response.json({ ok: true, role: user.role });
}
