import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

const CSRF_COOKIE = 'portal_csrf';
const CSRF_HEADER = 'x-csrf-token';

// Double-submit cookie pattern: a non-HttpOnly cookie (so client JS can
// read it and echo it back) plus a matching header on every
// state-changing request. An attacker's cross-site form can make the
// browser send the cookie automatically, but can't read it to put a
// matching value in the header — that's the entire protection.
export async function issueCsrfToken(): Promise<string> {
  const token = randomBytes(24).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  return token;
}

export async function verifyCsrf(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);
  return Boolean(cookieToken && headerToken && cookieToken === headerToken);
}

export { CSRF_HEADER };
