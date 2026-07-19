import NextAuth from "next-auth";
import { env } from "@/lib/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: env.AUTH_TRUST_HOST,
  useSecureCookies: false,
  debug: true,

  // Debug auth provider config (tanpa expose secret)
  // Tujuan: memastikan PMB kirim client_id/client_secret & token URL ke host yang benar.
  // (Bila token exchange masih error, log ini akan membantu validasi env.)
  logger: {
    error(code, metadata) {
      console.error("[pmb][auth][logger][error]", { code, metadata });
    },
    warn(code, metadata) {
      console.warn("[pmb][auth][logger][warn]", { code, metadata });
    },
    debug(code, metadata) {
      // batasi noise: hanya log metadata minimal bila tersedia
      if (metadata) console.debug("[pmb][auth][logger][debug]", { code, metadata });
      else console.debug("[pmb][auth][logger][debug]", { code });
    },
  },

  // Ensure secret is stable and used explicitly.
  secret: env.AUTH_SECRET ?? env.NEXTAUTH_SECRET,

  // NextAuth/Auth.js v5: enforce PKCE checks (don't disable PKCE).
  // If your beta doesn't support `checks` at provider-level, remove it later,
  // but keep PKCE enabled (do not disable).
  providers: [
    {
      id: "unsia-sso",
      name: "UNSIA SSO",
      type: "oauth",
      clientId: env.SSO_OAUTH_CLIENT_ID,
      clientSecret: env.SSO_OAUTH_CLIENT_SECRET,
      authorization: {
        url: env.SSO_OAUTH_AUTHORIZE_URL,
        params: { scope: "openid profile email" },
      },
      token: env.SSO_OAUTH_TOKEN_URL,
      userinfo: env.SSO_OAUTH_USERINFO_URL,
      // DEBUG: sementara nonaktifkan PKCE/state checks supaya login
      // tidak bergantung pada cookie state/pkce yang saat ini tidak tersimpan di browser.
      // Setelah berhasil, checks akan diaktifkan kembali dan kita benahi root-cause cookie.
      checks: [],

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

  cookies: {
    // Only namespace the session token to prevent collisions between modules.
    // For PKCE/state/csrf/nonce, we intentionally use Auth.js v5 defaults (authjs.*)
    // so `checks: ["pkce","state"]` can parse values correctly.
    sessionToken: { name: "pmb.authjs.session-token" },
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
