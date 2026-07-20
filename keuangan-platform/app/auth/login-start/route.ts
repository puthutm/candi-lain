import { NextResponse } from "next/server";

/*
 * Redirect to Auth.js built-in signin endpoint which properly sets
 * state/PKCE/nonce cookies and redirects to the SSO provider.
 */
export async function GET(request: Request) {
  const url = new URL("/api/auth/signin/unsia-sso", request.url);
  return NextResponse.redirect(url);
}
