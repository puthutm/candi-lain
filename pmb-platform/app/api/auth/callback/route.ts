import { NextResponse } from "next/server";
import { env } from "@/lib/env";

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

    // IMPORTANT:
    // Cookie state/PKCE/CSRF are validated by NextAuth on the *same origin*.
    // If we redirect to a different origin/protocol, browsers may not send the cookies
    // (or NextAuth will fail parsing the state), causing InvalidCheck errors.
    //
    // Therefore:
    // - default: always redirect using NEXT_PUBLIC_APP_URL origin
    // - only fall back to NEXT_PUBLIC_SSO_OAUTH_CALLBACK_URL / SSO_OAUTH_CALLBACK_URL
    //   when it matches host+protocol of NEXT_PUBLIC_APP_URL.
    const publicCallbackBase =
      process.env.NEXT_PUBLIC_SSO_OAUTH_CALLBACK_URL || process.env.SSO_OAUTH_CALLBACK_URL;

    const publicBase = new URL(publicBaseUrl);
    let resolvedBase = publicBase;

    if (publicCallbackBase) {
      try {
        const candidate = new URL(publicCallbackBase);
        const sameOrigin = candidate.origin === publicBase.origin;
        if (!sameOrigin) {
          console.warn("[pmb][auth][callback-config] Ignoring publicCallbackBase due to origin mismatch", {
            publicBaseOrigin: publicBase.origin,
            publicCallbackBaseOrigin: candidate.origin,
          });
        } else {
          resolvedBase = candidate;
        }
      } catch {
        console.warn("[pmb][auth][callback-config] Invalid publicCallbackBase, ignoring", {
          publicCallbackBase,
        });
      }
    }

    const nextAuthCallbackUrl = new URL("/api/auth/callback/unsia-sso", resolvedBase);
    nextAuthCallbackUrl.search = searchParams.toString();

    return NextResponse.redirect(nextAuthCallbackUrl.toString());
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
