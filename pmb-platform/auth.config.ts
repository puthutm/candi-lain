import NextAuth from "next-auth";
import { env } from "@/lib/env";

/**
 * PMB Auth.js / NextAuth config (provider + callbacks + cookies naming).
 * Keep this as the single source of truth for `pmb-platform/auth.ts`.
 */
export const authConfig: Parameters<typeof NextAuth>[0] = {
  trustHost: env.AUTH_TRUST_HOST,
  useSecureCookies: false,
  debug: true,

  secret: env.AUTH_SECRET ?? env.NEXTAUTH_SECRET,

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

      // Keep Auth.js v5 PKCE/state checks enabled.
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

  // Namespace cookies so NextAuth/Auth.js state/PKCE/CSRF/nonce are consistent
  // with PMB callback logic.
  cookies: {
    sessionToken: { name: "pmb.authjs.session-token" },
    callbackUrl: { name: "pmb.authjs.callback-url" },
    csrfToken: { name: "pmb.authjs.csrf-token" },
    pkceCodeVerifier: { name: "pmb.authjs.pkce.code_verifier" },
    state: { name: "pmb.authjs.state" },
    nonce: { name: "pmb.authjs.nonce" },
  },

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
};
