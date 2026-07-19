import NextAuth from "next-auth";
import { env } from "@/lib/env";
import { authConfig } from "./auth.config";

console.info("[pmb][auth][provider-env]", {
  hasClientId: Boolean(env.SSO_OAUTH_CLIENT_ID),
  hasClientSecret: Boolean(env.SSO_OAUTH_CLIENT_SECRET),
  tokenUrl: env.SSO_OAUTH_TOKEN_URL ? new URL(env.SSO_OAUTH_TOKEN_URL).host : null,
});

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
