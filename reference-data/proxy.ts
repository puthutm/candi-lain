import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Apply basic security headers
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Skip proxy verification for asset requests or API paths if needed
  const path = request.nextUrl.pathname;
  if (path.startsWith("/_next") || path === "/favicon.ico") {
    return response;
  }

  // Session checks for all main pages
  const sessionCookie = request.cookies.get("sso_session")?.value;
  if (!sessionCookie) {
    // Redirect to the SSO Core Login portal at http://localhost:3000/
    const ssoLoginUrl = new URL("http://localhost:3000/");
    ssoLoginUrl.searchParams.set("return_to", request.url);
    return NextResponse.redirect(ssoLoginUrl.toString());
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/reference|_next/static|_next/image|favicon.ico).*)",
  ],
};
