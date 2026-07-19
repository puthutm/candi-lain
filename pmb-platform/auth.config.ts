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

  cookies: {
    sessionToken: { name: "authjs.session-token", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    callbackUrl: { name: "authjs.callback-url", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    csrfToken: { name: "authjs.csrf-token", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    pkceCodeVerifier: {
      name: "authjs.pkce.code_verifier",
      options: { path: "/", sameSite: "lax", secure: false, httpOnly: true },
    },
    state: { name: "authjs.state", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    nonce: { name: "authjs.nonce", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
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
