import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Clean Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none';"
  );

  // Fast session precheck for protected pages
  const path = request.nextUrl.pathname;
  if (path.startsWith("/home") || path.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("sso_session")?.value;
    if (!sessionCookie) {
      const loginUrl = new URL("/", request.url);
      // Preserve pathname + query so RSC requests don't lose context and cause redirect loops
      const returnTo = `${path}${request.nextUrl.search || ""}`;
      loginUrl.searchParams.set("return_to", returnTo);
      return NextResponse.redirect(loginUrl.toString());
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/reference (public category queries)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/reference|_next/static|_next/image|favicon.ico).*)",
  ],
};
