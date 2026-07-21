import NextAuth from "next-auth";
import { NextRequest } from "next/server";

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
      token: process.env.SSO_OAUTH_TOKEN_URL,
      userinfo: process.env.SSO_OAUTH_USERINFO_URL,
      clientId: process.env.SSO_OAUTH_CLIENT_ID,
      clientSecret: process.env.SSO_OAUTH_CLIENT_SECRET,

      // Keep PKCE/state protections enabled
      checks: ["pkce", "state"],

      profile(profile: any) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          role: profile.roles?.[0] || "mahasiswa",
          roles: profile.roles || [],
        };
      },
    },
  ],

  // Namespace cookies so PKCE/state/csrf are not shared/mixed across modules.
  cookies: {
    sessionToken: { name: "siakad.authjs.session-token" },
    callbackUrl: { name: "siakad.authjs.callback-url" },
    csrfToken: { name: "siakad.authjs.csrf-token" },
    pkceCodeVerifier: { name: "siakad.authjs.pkce.code_verifier" },
    state: { name: "siakad.authjs.state" },
    nonce: { name: "siakad.authjs.nonce" },
  },

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = (user as any).role || "mahasiswa";
        token.roles = (user as any).roles || [];
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).role = token.role as string;
        (session.user as any).roles = token.roles as string[];
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
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
