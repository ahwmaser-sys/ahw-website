import { getPrincipal, type Principal } from './session';
import { prisma } from './db';

export class UnauthorizedError extends Error {
  status = 401;
}
export class ForbiddenError extends Error {
  status = 403;
}

// Every api/portal/* route handler and every /admin, /client layout calls
// this first. Deny-by-default: no session, no access — this is the one
// function a brand-new endpoint must call to not be wide open, per the
// brief's explicit "secure unless explicitly opened" principle.
export async function requireSession(): Promise<Principal> {
  const principal = await getPrincipal();
  if (!principal) throw new UnauthorizedError('Not authenticated.');
  return principal;
}

export function requireRole(principal: Principal, allowed: readonly string[]): void {
  const hasRole = principal.roles.some((r) => allowed.includes(r));
  if (!hasRole) throw new ForbiddenError('Insufficient role.');
}

// The check that actually matters for cross-client isolation: a role
// check alone ("is this a CLIENT") says nothing about *which* client's
// data they're allowed to see. This queries ProjectMember directly —
// scoped at the data layer, not inferred from anything the UI sent.
export async function requireProjectAccess(principal: Principal, projectId: string): Promise<void> {
  // Staff roles can access any project.
  if (principal.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(r))) {
    return;
  }

  const membership = await prisma.projectMember.findFirst({
    where: {
      projectId,
      OR: [{ userId: principal.userId }, { client: { user: { id: principal.userId } } }],
    },
  });

  if (!membership) {
    throw new ForbiddenError('Not a member of this project.');
  }
}

// Standard shape for turning the two errors above into an HTTP response
// from a route handler's catch block.
export function guardErrorResponse(error: unknown): Response | null {
  if (error instanceof UnauthorizedError) {
    return Response.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return Response.json({ error: error.message }, { status: 403 });
  }
  return null;
}
