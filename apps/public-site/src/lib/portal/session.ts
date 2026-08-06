import { randomBytes, createHash } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './db';

export const SESSION_COOKIE = 'portal_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type Realm = 'internal' | 'client';

// Shaped like packages/application's AuthenticatedPrincipal on purpose —
// see /PORTAL-PLAN.md §4. entityId is the User id in both realms; roles
// is always a single-element array here (this app has one role per
// user), kept as an array to match that interface's shape exactly.
export type Principal = Readonly<{
  userId: string;
  entityId: string;
  realm: Realm;
  roles: readonly string[];
}>;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function realmForRole(role: string): Realm {
  return role === 'CLIENT' ? 'client' : 'internal';
}

export async function createSession(
  userId: string,
  role: string,
  meta: { ipAddress?: string | undefined; userAgent?: string | undefined }
): Promise<void> {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  void role; // role itself isn't stored on the cookie/session row — always re-read from User at verify time, so a role change takes effect immediately rather than waiting for re-login.
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

// The one place that turns "a cookie was present" into "here is a
// verified, current principal." Always re-reads the user's role from the
// database rather than trusting anything cached in the cookie/session
// row, so a role change or account disable takes effect on the very next
// request, not at next login.
export async function getPrincipal(): Promise<Principal | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (session.user.status !== 'ACTIVE') return null;

  return {
    userId: session.user.id,
    entityId: session.user.id,
    realm: realmForRole(session.user.role),
    roles: [session.user.role],
  };
}
