import { NextResponse } from "next/server";

/**
 * Redirect to Auth.js built-in signin endpoint which properly sets
 * state/PKCE/nonce cookies and redirects to the SSO provider.
 *
 * Previously we called signIn() server-side and returned its Response,
 * but the Set-Cookie headers for state/pkce.code_verifier were not
 * being forwarded to the browser in the Docker/Next.js production
 * runtime, causing "InvalidCheck: state value could not be parsed"
 * errors on the callback.
 *
 * By redirecting to the built-in /api/auth/signin/unsia-sso endpoint,
 * the browser receives the cookies directly from the Auth.js handler
 * and the callback validation succeeds.
 */
export async function GET(request: Request) {
  const host = request.headers.get("host") || "10.10.20.56:3002";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const url = new URL("/auth/login", `${protocol}://${host}`);
  return NextResponse.redirect(url);
}

