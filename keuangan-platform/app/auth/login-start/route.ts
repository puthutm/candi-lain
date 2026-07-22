import { NextResponse } from "next/server";

/*
 * Redirect to Auth.js built-in signin endpoint which properly sets
 * state/PKCE/nonce cookies and redirects to the SSO provider.
 */
export async function GET(request: Request) {
  const host = request.headers.get("host") || "10.10.20.56:3005";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const url = new URL("/auth/login", `${protocol}://${host}`);
  return NextResponse.redirect(url);
}
