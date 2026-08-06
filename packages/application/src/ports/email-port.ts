export type EmailMessage = Readonly<{
  bodyText: string;
  locale: string;
  subject: string;
  to: string;
}>;

export interface EmailPort {
  send(message: EmailMessage): Promise<void>;
}
