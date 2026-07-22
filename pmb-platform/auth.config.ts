import NextAuth from "next-auth";
import { env } from "@/lib/env";

async function refreshAccessToken(token: any) {
  try {
    const url = process.env.SSO_OAUTH_TOKEN_URL || "http://10.10.20.56:3000/oauth/token";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: env.SSO_OAUTH_CLIENT_ID || "pmb-platform",
        client_secret: env.SSO_OAUTH_CLIENT_SECRET || "",
        refresh_token: token.refreshToken || "",
      }),
    });

    const refreshedTokens = await response.json();
    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (refreshedTokens.expires_in || 3600),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

/**
 * PMB Auth.js / NextAuth config (provider + callbacks + cookies naming).
 * Keep this as the single source of truth for `pmb-platform/auth.ts`.
 */
export const authConfig: Parameters<typeof NextAuth>[0] = {
  trustHost: true,
  useSecureCookies: false,
  debug: true,

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "super-secret-nextauth-key-pmb-platform-2026",

  providers: [
    {
      id: "unsia-sso",
      name: "UNSIA SSO",
      type: "oauth",
      clientId: process.env.SSO_OAUTH_CLIENT_ID || "pmb-platform",
      clientSecret: process.env.SSO_OAUTH_CLIENT_SECRET || "sec_pmb-platform_898f7b0bb665b73b751ad7b37c409ed3",
      allowInsecureHTTP: true,
      client: {
        token_endpoint_auth_method: "client_secret_basic",
        allowInsecureHTTP: true,
      },
      authorization: {
        url: process.env.SSO_OAUTH_AUTHORIZE_URL || "http://10.10.20.56:3000/oauth/authorize",
        params: { scope: "openid profile email" },
      },
      token: {
        url: process.env.SSO_OAUTH_TOKEN_URL || "http://10.10.20.56:3000/oauth/token",
      },
      userinfo: {
        url: process.env.SSO_OAUTH_USERINFO_URL || "http://10.10.20.56:3000/oauth/userinfo",
      },

      // Keep Auth.js v5 PKCE/state checks enabled.
      checks: ["pkce", "state"],

      profile(profile: any) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          role: profile.roles?.[0] || "user",
          username: profile.preferred_username,
        };
      },
    } as any,
  ],

  cookies: {
    sessionToken: { name: "pmb.authjs.session-token", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    callbackUrl: { name: "pmb.authjs.callback-url", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    csrfToken: { name: "pmb.authjs.csrf-token", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    pkceCodeVerifier: {
      name: "pmb.authjs.pkce.code_verifier",
      options: { path: "/", sameSite: "lax", secure: false, httpOnly: true },
    },
    state: { name: "pmb.authjs.state", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    nonce: { name: "pmb.authjs.nonce", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
  },

  callbacks: {
    async jwt({ token, user, account }: any) {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
          role: (user as any).role,
          username: (user as any).username,
        };
      }

      if (Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.sub as string;
        (session.user as any).role = token.role as string;
        (session.user as any).username = token.username as string;
      }
      return session;
    },
  },
};
