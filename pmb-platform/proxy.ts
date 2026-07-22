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
  "/api/seed",
  "/api/meta",
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

  if (pathname.startsWith("/admin")) {
    const role = (session.user as any)?.role;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export function getPublicCallbackBase(): string {
  return (
    process.env.NEXT_PUBLIC_SSO_OAUTH_CALLBACK_URL ||
    process.env.SSO_OAUTH_CALLBACK_URL ||
    ""
  );
}

export function buildNextAuthCallbackUrl(searchParams: URLSearchParams): URL {
  const publicBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!publicBaseUrl) {
    throw new Error(
      "Missing env NEXT_PUBLIC_APP_URL (public base URL for redirects)"
    );
  }

  const nextAuthCallbackPath = "/api/auth/callback/unsia-sso";

  const publicCallbackBase = getPublicCallbackBase();
  const base = publicCallbackBase || publicBaseUrl;

  const nextAuthCallbackUrl = new URL(nextAuthCallbackPath, base);
  nextAuthCallbackUrl.search = searchParams.toString();

  return nextAuthCallbackUrl;
}

export function redirectToNextAuthCallback(args: {
  code: string | null;
  req: Request;
}): Response {
  const { code, req } = args;

  if (!code) {
    return NextResponse.json(
      { success: false, error: "Missing authorization code" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const nextAuthCallbackUrl = buildNextAuthCallbackUrl(searchParams);

  return NextResponse.redirect(nextAuthCallbackUrl.toString());
}
