import { NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * IMPORTANT:
 * This endpoint used to 302-redirect to NextAuth's provider callback:
 *   /api/auth/callback/unsia-sso
 *
 * That redirect created a second hop and can break Auth.js cookie context
 * (PKCE/state/csrf/nonce), leading to errors like:
 *   "InvalidCheck: state value could not be parsed"
 *
 * SSO provider MUST call the correct callback URL directly:
 *   /api/auth/callback/unsia-sso
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Keep some visibility for ops/debugging.
  console.error("[pmb][auth][callback] legacy callback endpoint hit - fail fast", {
    AUTH_TRUST_HOST: env.AUTH_TRUST_HOST,
    AUTH_URL: env.AUTH_URL,
    NEXTAUTH_URL: env.NEXTAUTH_URL,
    hasAUTH_SECRET: Boolean(env.AUTH_SECRET),
    hasNEXTAUTH_SECRET: Boolean(env.NEXTAUTH_SECRET),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? "set" : "missing",
    NEXT_PUBLIC_SSO_OAUTH_CALLBACK_URL: process.env.NEXT_PUBLIC_SSO_OAUTH_CALLBACK_URL
      ? "set"
      : process.env.SSO_OAUTH_CALLBACK_URL
        ? "set"
        : "missing",
    incoming: {
      codePresent: Boolean(searchParams.get("code")),
      statePresent: Boolean(searchParams.get("state")),
      all: searchParams.toString(),
    },
  });

  return NextResponse.json(
    {
      success: false,
      error: "Legacy callback endpoint disabled. Configure SSO_OAUTH_CALLBACK_URL / NEXT_PUBLIC_SSO_OAUTH_CALLBACK_URL to point directly to /api/auth/callback/unsia-sso.",
    },
    { status: 410 }
  );
}

export const dynamic = "force-dynamic";
