import NextAuth from "next-auth";
import { env } from "@/lib/env";

console.info("[pmb][auth][provider-env]", {
  hasClientId: Boolean(env.SSO_OAUTH_CLIENT_ID),
  hasClientSecret: Boolean(env.SSO_OAUTH_CLIENT_SECRET),
  tokenUrl: env.SSO_OAUTH_TOKEN_URL ? new URL(env.SSO_OAUTH_TOKEN_URL).host : null,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: env.AUTH_TRUST_HOST,
  useSecureCookies: false,
  debug: true,

  // Ensure secret is stable and used explicitly.
  secret: env.AUTH_SECRET ?? env.NEXTAUTH_SECRET,

  // NextAuth/Auth.js v5: enforce PKCE checks (don't disable PKCE).
  // If your beta doesn't support `checks` at provider-level, remove it later,
  // but keep PKCE enabled (do not disable).
  providers: [
    {
      id: "unsia-sso",
      name: "UNSIA SSO",
      type: "oauth",
      clientId: env.SSO_OAUTH_CLIENT_ID,
      clientSecret: env.SSO_OAUTH_CLIENT_SECRET,
      authorization: {
        url: env.SSO_OAUTH_AUTHORIZE_URL,
        params: { scope: "openid profile email" },
      },
      token: env.SSO_OAUTH_TOKEN_URL,
      userinfo: env.SSO_OAUTH_USERINFO_URL,

      // Use Auth.js v5 PKCE/state checks (required for OAuth code exchange security)
      checks: ["pkce", "state"],

      profile(profile: any) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          role: profile.roles?.[0] || "user",
        };
      },
    },
  ],

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
});
