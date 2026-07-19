import NextAuth from "next-auth";
import { env } from "@/lib/env";

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
    sessionToken: { name: "pmb.authjs.session-token" },

    // Keep callbackUrl namespaced, but align the rest with Auth.js v5
    // so checks ["pkce","state"] can successfully parse the cookies.
    callbackUrl: { name: "pmb.authjs.callback-url" },
    csrfToken: { name: "authjs.csrf-token" },
    pkceCodeVerifier: { name: "authjs.pkce.code_verifier" },
    state: { name: "authjs.state" },
    nonce: { name: "authjs.nonce" },
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
});
