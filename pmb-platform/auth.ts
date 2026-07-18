import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Keep host handling stable behind reverse proxy/docker
  trustHost: true,

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

  // Temporary: help diagnose cookie/PKCE parsing issues.
  debug: process.env.NODE_ENV !== "production",
});
