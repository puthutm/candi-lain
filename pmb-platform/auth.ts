import NextAuth from "next-auth";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,

  // We're on HTTP in local/intranet deployment.
  useSecureCookies: false,

  // Ensure secret is stable and used explicitly.
  secret,

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

  // Use unique cookie names to avoid collisions across apps on same host:port family.
  // Keep this conservative (name only) to minimize schema mismatch in next-auth beta.
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
});
