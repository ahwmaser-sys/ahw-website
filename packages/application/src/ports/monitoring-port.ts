export type MonitoringContext = Readonly<Record<string, string | number | boolean>>;

export interface MonitoringPort {
  captureException(error: unknown, context?: MonitoringContext): void;
  captureMessage(message: string, context?: MonitoringContext): void;
}
