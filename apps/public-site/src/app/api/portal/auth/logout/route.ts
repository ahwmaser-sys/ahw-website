import { destroySession, getPrincipal } from '../../../../../lib/portal/session';
import { recordActivity, getClientIp } from '../../../../../lib/portal/audit';

export async function POST(request: Request) {
  const principal = await getPrincipal();
  await destroySession();

  if (principal) {
    await recordActivity({
      actorId: principal.userId,
      action: 'auth.logout',
      ipAddress: getClientIp(request),
    });
  }

  return Response.json({ ok: true });
}
