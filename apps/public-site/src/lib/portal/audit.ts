import { prisma } from './db';

// Shaped like packages/application's AuditPort.record() — see
// /PORTAL-PLAN.md §1/§4. metadata is deliberately loose JSON, not a rigid
// column set: an audit write that can fail because a new event type
// doesn't fit the schema is worse than one with a slightly-untyped payload.
export async function recordActivity(entry: {
  actorId?: string | undefined;
  actorEmail?: string | undefined;
  action: string;
  entityType?: string | undefined;
  entityId?: string | undefined;
  projectId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  ipAddress?: string | undefined;
}): Promise<void> {
  await prisma.activityLog.create({
    data: {
      actorId: entry.actorId ?? null,
      actorEmail: entry.actorEmail ?? null,
      action: entry.action,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      projectId: entry.projectId ?? null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      ipAddress: entry.ipAddress ?? null,
    },
  });
}

export function getClientIp(request: Request): string | undefined {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined;
}
