import { NextResponse } from "next/server";

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

  // PMB NextAuth callback path for provider "unsia-sso"
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

/**
 * Next.js expects `proxy()` when a file is named `proxy.ts` at the root of `app/`.
 * We don't use this file as a runtime proxy; it's kept only for helper functions.
 * This no-op proxy prevents Next.js build-time errors.
 */
export async function proxy() {
  return NextResponse.next();
}
