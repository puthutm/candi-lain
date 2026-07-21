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
          role: profile.roles?.[0] || "pegawai",
          roles: profile.roles || [],
        };
      },
    },
  ],

  // Namespace cookies so PKCE/state/csrf are not shared/mixed across modules.
  cookies: {
    sessionToken: { name: "hris.authjs.session-token" },
    callbackUrl: { name: "hris.authjs.callback-url" },
    csrfToken: { name: "hris.authjs.csrf-token" },
    pkceCodeVerifier: { name: "hris.authjs.pkce.code_verifier" },
    state: { name: "hris.authjs.state" },
    nonce: { name: "hris.authjs.nonce" },
  },

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = (user as any).role || "pegawai";
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

const wrappedGet = (req: any, ...args: any[]) => {
  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  if (host) {
    const urlObj = new URL(req.url);
    const isLocalOrContainer =
      urlObj.hostname === "localhost" ||
      urlObj.hostname === "127.0.0.1" ||
      !urlObj.hostname.includes(".");

    if (isLocalOrContainer) {
      urlObj.host = host;
      urlObj.protocol = protocol;
      const modifiedReq = new NextRequest(urlObj.toString(), req);
      return (originalGet as any)(modifiedReq, ...args);
    }
  }
  return (originalGet as any)(req, ...args);
};

const wrappedPost = (req: any, ...args: any[]) => {
  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  if (host) {
    const urlObj = new URL(req.url);
    const isLocalOrContainer =
      urlObj.hostname === "localhost" ||
      urlObj.hostname === "127.0.0.1" ||
      !urlObj.hostname.includes(".");

    if (isLocalOrContainer) {
      urlObj.host = host;
      urlObj.protocol = protocol;
      const modifiedReq = new NextRequest(urlObj.toString(), req);
      return (originalPost as any)(modifiedReq, ...args);
    }
  }
  return (originalPost as any)(req, ...args);
};

export const handlers = { GET: wrappedGet, POST: wrappedPost };
export const { auth, signIn, signOut } = parsedNextAuth;
