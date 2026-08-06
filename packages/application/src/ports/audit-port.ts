export type AuditRecord = Readonly<{
  actionType: string;
  actorUserId: string;
  entityId: string;
  occurredAt: string;
  sourceEventType: string;
}>;

export interface AuditPort {
  record(entry: AuditRecord): Promise<void>;
}
