import NextAuth from "next-auth";

async function refreshAccessToken(token: any) {
  try {
    const url = process.env.SSO_OAUTH_TOKEN_URL || "http://10.10.20.56:3000/oauth/token";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.SSO_OAUTH_CLIENT_ID || "siakad-platform",
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
      // Do NOT set wellKnown — openid-client v6 only allows HTTPS for discovery.
      // Explicit endpoint URLs below bypass discovery entirely.
      issuer: process.env.SSO_OAUTH_ISSUER || "http://10.10.20.56:3000",
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
      clientId: process.env.SSO_OAUTH_CLIENT_ID || "siakad-platform",
      clientSecret: process.env.SSO_OAUTH_CLIENT_SECRET,
      allowInsecureHTTP: true,
      client: {
        token_endpoint_auth_method: "client_secret_basic",
        allowInsecureHTTP: true,
      },
      checks: ["pkce", "state"],
      profile(profile: any) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          role: profile.roles?.[0] || "mahasiswa",
          roles: profile.roles || [],
          username: profile.preferred_username,
        };
      },
    } as any,
  ],

  cookies: {
    sessionToken: { name: "siakad.authjs.session-token" },
    callbackUrl: { name: "siakad.authjs.callback-url" },
    csrfToken: { name: "siakad.authjs.csrf-token" },
    pkceCodeVerifier: { name: "siakad.authjs.pkce.code_verifier" },
    state: { name: "siakad.authjs.state" },
    nonce: { name: "siakad.authjs.nonce" },
  },

  callbacks: {
    async jwt({ token, user, account }: any) {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
          role: (user as any).role || "mahasiswa",
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

  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "super-secret-nextauth-key-siakad-platform-2026",
});

export const { handlers, auth, signIn, signOut } = parsedNextAuth;
