import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none';"
  );

  const path = request.nextUrl.pathname;

  const isRscQuery = request.nextUrl.searchParams.has("_rsc");
  const accept = request.headers.get("accept") || "";

  const isRscByAccept =
    accept.includes("text/x-component") || accept.includes("application/x-nextjs-component");

  const isRscByHeader =
    request.headers.get("rsc") === "1" ||
    request.headers.get("x-nextjs-rsc") === "1" ||
    request.headers.get("next-rsc") === "1";

  const looksLikeRsc = isRscQuery || isRscByAccept || isRscByHeader;
  const isDocumentRequest = accept.includes("text/html");

  if ((path.startsWith("/home") || path.startsWith("/admin")) && !looksLikeRsc && isDocumentRequest) {
    const sessionCookie = request.cookies.get("sso_session")?.value;
    if (!sessionCookie) {
      const loginUrl = new URL("/", request.url);
      const returnTo = `${path}${request.nextUrl.search || ""}`;
      loginUrl.searchParams.set("return_to", returnTo);
      return NextResponse.redirect(loginUrl.toString());
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api/reference|_next/static|_next/image|favicon.ico).*)"],
};
