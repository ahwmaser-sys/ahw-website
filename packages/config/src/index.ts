export type RuntimeEnvironment = "local" | "development" | "staging" | "production";

export type PlatformConfig = Readonly<{
  appEnv: RuntimeEnvironment;
  coreApiUrl: string;
  publicSiteUrl: string;
  webAppUrl: string;
}>;
