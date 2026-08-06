export type AdapterProvider =
  | "postgres-full-text-search"
  | "posthog"
  | "railway"
  | "resend"
  | "sentry"
  | "supabase-auth"
  | "supabase-postgres"
  | "supabase-storage"
  | "vercel";

export type AdapterRegistration = Readonly<{
  provider: AdapterProvider;
  portName: string;
}>;
