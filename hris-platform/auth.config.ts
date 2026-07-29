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
        client_id: env.SSO_OAUTH_CLIENT_ID || "hris-platform",
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
 * HRIS Auth.js / NextAuth configuration.
 */
export const authConfig: Parameters<typeof NextAuth>[0] = {
  trustHost: true,
  useSecureCookies: false,
  debug: true,

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "super-secret-nextauth-key-hris-platform-2026",

  providers: [
    {
      id: "unsia-sso",
      name: "UNSIA SSO",
      type: "oidc",
      clientId: process.env.SSO_OAUTH_CLIENT_ID || "hris-platform",
      clientSecret: process.env.SSO_OAUTH_CLIENT_SECRET || "sec_hris-platform_client-secret-key-2026",
      issuer: process.env.SSO_OAUTH_ISSUER_URL || "http://10.10.20.56:3000",
      allowInsecureHTTP: true,
      checks: ["pkce", "state"],
      authorization: {
        url: process.env.SSO_OAUTH_AUTHORIZE_URL || "http://10.10.20.56:3000/oauth/authorize",
        params: { scope: "openid profile email" },
      },
      token: process.env.SSO_OAUTH_TOKEN_URL || "http://10.10.20.56:3000/oauth/token",
      userinfo: process.env.SSO_OAUTH_USERINFO_URL || "http://10.10.20.56:3000/oauth/userinfo",
      profile(profile: any) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          role: profile.roles?.[0] || "admin_data_sdm",
          username: profile.preferred_username,
        };
      },
    } as any,
  ],

  cookies: {
    sessionToken: { name: "hris.authjs.session-token", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    callbackUrl: { name: "hris.authjs.callback-url", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    csrfToken: { name: "hris.authjs.csrf-token", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    pkceCodeVerifier: { name: "hris.authjs.pkce.code_verifier", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    state: { name: "hris.authjs.state", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } },
    nonce: { name: "hris.authjs.nonce", options: { path: "/", sameSite: "lax", secure: false, httpOnly: true } }
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
