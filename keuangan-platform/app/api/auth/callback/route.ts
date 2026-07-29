import { NextResponse } from "next/server";

/**
 * Legacy OAuth callback endpoint — intentionally disabled.
 *
 * SSO must call the NextAuth provider callback directly:
 *   /api/auth/callback/unsia-sso
 *
 * Redirecting from here to the provider callback creates a second hop
 * that can break Auth.js cookie context (PKCE/state/nonce), causing
 * "InvalidCheck: state value could not be parsed" errors.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Legacy callback disabled. Configure SSO redirect_uri to /api/auth/callback/unsia-sso.",
    },
    { status: 410 }
  );
}

export const dynamic = "force-dynamic";
