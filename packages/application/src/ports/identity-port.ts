export type AuthenticatedPrincipal = Readonly<{
  entityId: string;
  realm: "internal" | "client" | "vendor";
  roles: readonly string[];
  userId: string;
}>;

export interface IdentityPort {
  verifyAccessToken(token: string): Promise<AuthenticatedPrincipal>;
}
