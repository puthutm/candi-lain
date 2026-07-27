import NextAuth from "next-auth";
import { env } from "@/lib/env";

/**
 * Refresh the access token using the refresh token.
 */
async function refreshAccessToken(token: any) {
  try {
    const url = process.env.SSO_OAUTH_TOKEN_URL || "http://10.10.20.56:3000/oauth/token";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: env.SSO_OAUTH_CLIENT_ID || "keuangan-platform",
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
 * Keuangan Platform Auth.js / NextAuth configuration.
 */
export const authConfig: Parameters<typeof NextAuth>[0] = {
  trustHost: true,
  useSecureCookies: false,
  debug: true,

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "super-secret-nextauth-key-keuangan-platform-2026",

  providers: [
    {
      id: "unsia-sso",
      name: "UNSIA SSO",
      type: "oidc",
      clientId: process.env.SSO_OAUTH_CLIENT_ID || "keuangan-platform",
      clientSecret: process.env.SSO_OAUTH_CLIENT_SECRET || "sec_keuangan-platform_client-secret-key-2026",
      issuer: process.env.SSO_OAUTH_ISSUER_URL || "http://10.10.20.56:3000",
      allowInsecureHTTP: true,
      checks: ["pkce", "state"],
      authorization: { params: { scope: "openid profile email" } },
      profile(profile: any) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          role: profile.roles?.[0] || "kepala_biro",
          username: profile.preferred_username,
        };
      },
    } as any,
  ],

  cookies: {
    sessionToken: { name: "keuangan.authjs.session-token", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    callbackUrl: { name: "keuangan.authjs.callback-url", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    csrfToken: { name: "keuangan.authjs.csrf-token", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    pkceCodeVerifier: { name: "keuangan.authjs.pkce.code_verifier", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    state: { name: "keuangan.authjs.state", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    nonce: { name: "keuangan.authjs.nonce", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } }
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url && url.includes("/auth/login")) {
        return baseUrl;
      }
      try {
        const urlObj = new URL(url);
        const baseObj = new URL(baseUrl);
        return urlObj.origin === baseObj.origin ? url : baseUrl;
      } catch {
        return baseUrl;
      }
    },
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
      if (Date.now() < (token.expiresAt as number) * 1000) return token;
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
