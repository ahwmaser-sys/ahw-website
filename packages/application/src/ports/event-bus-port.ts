export type DomainEventEnvelope = Readonly<{
  eventId: string;
  eventType: string;
  occurredAt: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export interface EventBusPort {
  publish(event: DomainEventEnvelope): Promise<void>;
}
