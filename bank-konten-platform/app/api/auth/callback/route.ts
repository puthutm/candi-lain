import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ success: false, error: "Missing authorization code" }, { status: 400 });
    }

    // 1. Get code verifier from cookies
    const cookieStore = await cookies();
    let codeVerifier = cookieStore.get("sso_code_verifier")?.value;

    // Fallback for IdP-initiated login (SSO Portal Direct flow)
    const state = searchParams.get("state");
    if (!codeVerifier && state === "sso_portal_direct") {
      codeVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    }

    if (!codeVerifier) {
      return NextResponse.json({ success: false, error: "Missing code verifier cookie" }, { status: 400 });
    }

    const clientId = process.env.SSO_OAUTH_CLIENT_ID || "bank-konten-platform";
    const clientSecret = process.env.SSO_OAUTH_CLIENT_SECRET || "bank-konten-platform-client-secret-key-2026";
    const authorizeUrlStr = process.env.SSO_OAUTH_AUTHORIZE_URL || "http://localhost:3000/oauth/authorize";
    const tokenUrl = process.env.SSO_OAUTH_TOKEN_URL || "http://localhost:3000/oauth/token";
    const requestUrl = new URL(req.url);
    const callbackUrl = `${requestUrl.protocol}//${requestUrl.host}${requestUrl.pathname}`;

    // 2. Call SSO token endpoint via HTTP POST (server-to-server)
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        code_verifier: codeVerifier,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: errorData.error_description || errorData.error || "Failed to exchange authorization code"
      }, { status: tokenResponse.status });
    }

    const tokens = await tokenResponse.json();
    const idToken = tokens.id_token;

    if (!idToken) {
      return NextResponse.json({ success: false, error: "Missing id_token in token response" }, { status: 400 });
    }

    // 3. Resolve JWKS URL and verify id_token JWT (RS256)
    const authorizeUrl = new URL(authorizeUrlStr);
    const jwksUrl = new URL("/.well-known/jwks.json", authorizeUrl.origin).toString();

    const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: "urn:unsia:sso",
      audience: clientId,
    });

    const userId = payload.sub as string;
    const name = payload.name as string;
    const username = payload.preferred_username as string;
    const roles = (payload.roles as string[]) || [];
    const role = roles.length > 0 ? roles[0] : "dosen";

    // 4. Save session cookie
    cookieStore.set("bank_user", JSON.stringify({
      userId,
      name,
      username,
      role,
    }), {
      path: "/",
      maxAge: 86400,
    });

    // 5. Clean up temporary verifier cookie
    cookieStore.delete("sso_code_verifier");

    // 6. Redirect back to homepage
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error: any) {
    console.error("SSO callback error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
