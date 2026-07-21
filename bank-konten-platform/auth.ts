import NextAuth from "next-auth";

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
          role: profile.roles?.[0] || "dosen",
          roles: profile.roles || [],
        };
      },
    },
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
    async jwt({ token, user }: any) {
      if (user) {
        token.role = (user as any).role || "dosen";
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

const wrappedGet = (req: Request) => {
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
      const modifiedReq = new Request(urlObj.toString(), req);
      return originalGet(modifiedReq);
    }
  }
  return originalGet(req);
};

const wrappedPost = (req: Request) => {
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
      const modifiedReq = new Request(urlObj.toString(), req);
      return originalPost(modifiedReq);
    }
  }
  return originalPost(req);
};

export const handlers = { GET: wrappedGet, POST: wrappedPost };
export const { auth, signIn, signOut } = parsedNextAuth;
