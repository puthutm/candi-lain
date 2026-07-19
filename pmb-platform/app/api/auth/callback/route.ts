import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { buildNextAuthCallbackUrl } from "@/proxy";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    console.info("[pmb][auth][callback-config]", {
      AUTH_TRUST_HOST: env.AUTH_TRUST_HOST,
      AUTH_URL: env.AUTH_URL,
      NEXTAUTH_URL: env.NEXTAUTH_URL,
      hasAUTH_SECRET: Boolean(env.AUTH_SECRET),
      hasNEXTAUTH_SECRET: Boolean(env.NEXTAUTH_SECRET),
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? "set" : "missing",
      NEXT_PUBLIC_SSO_OAUTH_CALLBACK_URL: process.env.NEXT_PUBLIC_SSO_OAUTH_CALLBACK_URL
        ? "set"
        : process.env.SSO_OAUTH_CALLBACK_URL
        ? "set"
        : "missing",
    });

    // Debug cookie presence for PKCE/state/csrf/nonces.
    // NOTE: only checks existence of cookie keys, not cookie values.
    const cookieHeader = req.headers.get("cookie") || "";

    const stateMatches = cookieHeader.match(/(?:^|;\s*)([^=;\s]+)\s*=\s*/g) || [];
    const interestingCookieKeys = stateMatches
      .map((m) => m.replace(/^[;\s]+/, "").replace(/\s*=\s*$/, ""))
      .filter((k) => /(state|pkce|csrf|nonce)/i.test(k));

    const hasPkce = cookieHeader.includes("pmb.authjs.pkce.code_verifier=");
    const hasState = cookieHeader.includes("pmb.authjs.state=");
    const hasCsrf = cookieHeader.includes("pmb.authjs.csrf-token=");
    const hasNonce = cookieHeader.includes("pmb.authjs.nonce=");

    const hasDefaultPkce = cookieHeader.includes("authjs.pkce.code_verifier=");
    const hasDefaultState = cookieHeader.includes("authjs.state=");
    const hasDefaultCsrf = cookieHeader.includes("authjs.csrf-token=");
    const hasDefaultNonce = cookieHeader.includes("authjs.nonce=");

    console.info("[pmb][auth][callback-cookie-debug] interesting cookie keys (state/pkce/csrf/nonce)", {
      interestingCookieKeys,
      rawCookieHeaderSnippet: cookieHeader.slice(0, 600),
    });

    console.info("[pmb][auth][callback-cookie-presence]", {
      pmb: { hasPkce, hasState, hasCsrf, hasNonce },
      default: { hasPkce: hasDefaultPkce, hasState: hasDefaultState, hasCsrf: hasDefaultCsrf, hasNonce: hasDefaultNonce },
    });

    if (!code) {
      return NextResponse.json({ success: false, error: "Missing authorization code" }, { status: 400 });
    }

    // Redirect to NextAuth's expected callback path.
    // IMPORTANT: use PUBLIC URL so redirect doesn't inherit internal docker Hostnames.
    const publicBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!publicBaseUrl) {
      return NextResponse.json(
        { success: false, error: "Missing env NEXT_PUBLIC_APP_URL (public base URL for redirects)" },
        { status: 500 }
      );
    }

    const nextAuthCallbackUrl = buildNextAuthCallbackUrl(searchParams);
    return NextResponse.redirect(nextAuthCallbackUrl.toString());
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
