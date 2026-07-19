import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        };
      },
    },
  ],

  // Namespace cookies so PKCE/state/csrf are not shared/mixed across modules.
  cookies: {
    sessionToken: { name: "lms.authjs.session-token" },
    callbackUrl: { name: "lms.authjs.callback-url" },
    csrfToken: { name: "lms.authjs.csrf-token" },
    pkceCodeVerifier: { name: "lms.authjs.pkce.code_verifier" },
    state: { name: "lms.authjs.state" },
    nonce: { name: "lms.authjs.nonce" },
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

  secret: process.env.NEXTAUTH_SECRET,
});
