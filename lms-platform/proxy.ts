import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS: string[] = [
  "/",
  "/auth/login",
  "/auth/login-start",
  "/auth/error",
  "/api/auth/callback",
  "/api/auth/callback/unsia-sso",
  "/api/auth/[...nextauth]",
  "/api/auth/session",
  "/api/auth/logout",
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
];

function isPublic(pathname: string) {
  if (pathname.startsWith("/_next") || pathname.startsWith("/api/auth") || pathname.includes(".")) return true;
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const session = await auth();
  if (!session?.user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("return_to", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/dosen")) {
    const role = (session.user as any)?.role;
    if (role !== "admin" && role !== "dosen") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth/.*).*)"],
};
