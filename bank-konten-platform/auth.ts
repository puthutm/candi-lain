import NextAuth from "next-auth";
import { NextRequest } from "next/server";

async function refreshAccessToken(token: any) {
  try {
    const url = process.env.SSO_OAUTH_TOKEN_URL || "http://10.10.20.56:3000/oauth/token";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.SSO_OAUTH_CLIENT_ID || "bank-konten-platform",
        client_secret: process.env.SSO_OAUTH_CLIENT_SECRET || "",
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

const parsedNextAuth = NextAuth({
  trustHost: true,
  debug: true,

  providers: [
    {
      id: "unsia-sso",
      name: "UNSIA SSO",
      type: "oauth",
      authorization: {
        url: process.env.SSO_OAUTH_AUTHORIZE_URL,
        params: { scope: "openid profile email" },
      },
      token: {
        url: process.env.SSO_OAUTH_TOKEN_URL,
      },
      userinfo: {
        url: process.env.SSO_OAUTH_USERINFO_URL,
      },
      clientId: process.env.SSO_OAUTH_CLIENT_ID,
      clientSecret: process.env.SSO_OAUTH_CLIENT_SECRET,
      allowInsecureHTTP: true,
      client: {
        token_endpoint_auth_method: "client_secret_basic",
        allowInsecureHTTP: true,
      },

      // Keep PKCE/state protections enabled
      checks: ["pkce", "state"],

      profile(profile: any) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          role: profile.roles?.[0] || "dosen",
          roles: profile.roles || [],
          username: profile.preferred_username,
        };
      },
    } as any,
  ],

  // Namespace cookies so PKCE/state/csrf are not shared/mixed across modules.
  cookies: {
    sessionToken: { name: "bank-konten.authjs.session-token" },
    callbackUrl: { name: "bank-konten.authjs.callback-url" },
    csrfToken: { name: "bank-konten.authjs.csrf-token" },
    pkceCodeVerifier: { name: "bank-konten.authjs.pkce.code_verifier" },
    state: { name: "bank-konten.authjs.state" },
    nonce: { name: "bank-konten.authjs.nonce" },
  },

  callbacks: {
    async jwt({ token, user, account }: any) {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
          role: (user as any).role || "dosen",
          roles: (user as any).roles || [],
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
        (session.user as any).roles = token.roles as string[];
        (session.user as any).username = token.username as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "super-secret-nextauth-key-bank-konten-platform-2026",
});

const originalGet = parsedNextAuth.handlers.GET;
const originalPost = parsedNextAuth.handlers.POST;

const getNextauthParams = (url: string) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const prefix = "/api/auth/";
    if (pathname.startsWith(prefix)) {
      const remaining = pathname.substring(prefix.length);
      if (remaining) {
        return remaining.split("/");
      }
    }
  } catch {}
  return undefined;
};

const wrappedGet = (req: any, ...args: any[]) => {
  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "http";

  let modifiedReq = req;
  let modifiedArgs = args;

  if (host) {
    const urlObj = new URL(req.url);
    const isLocalOrContainer =
      urlObj.hostname === "localhost" ||
      urlObj.hostname === "127.0.0.1" ||
      !urlObj.hostname.includes(".");

    if (isLocalOrContainer) {
      urlObj.host = host;
      urlObj.protocol = protocol;
      modifiedReq = new NextRequest(urlObj.toString(), req);
    }
  }

  const parsedParams = getNextauthParams(modifiedReq.url);
  if (parsedParams) {
    const context = args[0] || {};
    context.params = { nextauth: parsedParams };
    modifiedArgs = [context, ...args.slice(1)];
  }

  return (originalGet as any)(modifiedReq, ...modifiedArgs);
};

const wrappedPost = (req: any, ...args: any[]) => {
  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "http";

  let modifiedReq = req;
  let modifiedArgs = args;

  if (host) {
    const urlObj = new URL(req.url);
    const isLocalOrContainer =
      urlObj.hostname === "localhost" ||
      urlObj.hostname === "127.0.0.1" ||
      !urlObj.hostname.includes(".");

    if (isLocalOrContainer) {
      urlObj.host = host;
      urlObj.protocol = protocol;
      modifiedReq = new NextRequest(urlObj.toString(), req);
    }
  }

  const parsedParams = getNextauthParams(modifiedReq.url);
  if (parsedParams) {
    const context = args[0] || {};
    context.params = { nextauth: parsedParams };
    modifiedArgs = [context, ...args.slice(1)];
  }

  return (originalPost as any)(modifiedReq, ...modifiedArgs);
};

export const handlers = { GET: wrappedGet, POST: wrappedPost };
export const { auth, signIn, signOut } = parsedNextAuth;
