import { NextResponse, type NextRequest } from "next/server";
import { OAuth2Service } from "@/lib/services/oauth2";
import { rateLimit } from "@/lib/redis";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: URLSearchParams;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      body = new URLSearchParams(text);
    } else {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Content-Type must be application/x-www-form-urlencoded" },
        { status: 400 }
      );
    }

    const grantType = body.get("grant_type");
    let clientId = body.get("client_id");
    let clientSecret = body.get("client_secret");

    // Some OAuth clients (including some Auth.js/NextAuth implementations) may send
    // client_id/client_secret using HTTP Basic auth instead of form fields.
    // Your token endpoint requires form fields, so we bridge Basic -> form fields.
    const authHeader = request.headers.get("authorization") || "";
    const isBasic = authHeader.toLowerCase().startsWith("basic ");
    if ((!clientId || !clientSecret) && isBasic) {
      const b64 = authHeader.slice("basic ".length).trim();
      try {
        const decoded = Buffer.from(b64, "base64").toString("utf8");
        const idx = decoded.indexOf(":");
        if (idx > -1) {
          const basicClientId = decoded.slice(0, idx);
          const basicClientSecret = decoded.slice(idx + 1);
          clientId = clientId || basicClientId;
          clientSecret = clientSecret || basicClientSecret;
        }
      } catch {
        // ignore invalid basic auth encoding
      }
    }

    console.info("[sso][oauth][token][debug][incoming-form]", {
      grantType,
      clientId,
      hasClientSecret: Boolean(clientSecret),
      usedBasicAuth: Boolean(isBasic),
    });

    if (!grantType || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Missing required form fields (grant_type, client_id, client_secret)" },
        { status: 400 }
      );
    }

    // Rate limiting: max 10 requests per minute per client application
    const rateLimitKey = `rate_limit:token:${clientId}`;
    const rateCheck = await rateLimit(rateLimitKey, 10, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "slow_down", error_description: "Too many token requests. Please try again later." },
        { status: 429 }
      );
    }

    if (grantType === "authorization_code") {
      const code = body.get("code");
      const codeVerifier = body.get("code_verifier");
      const redirectUri = body.get("redirect_uri");

      if (!code || !codeVerifier || !redirectUri) {
        return NextResponse.json(
          { error: "invalid_request", error_description: "Missing required authorization_code parameters" },
          { status: 400 }
        );
      }

      const tokens = await OAuth2Service.exchangeCodeForTokens({
        code,
        codeVerifier,
        clientId,
        clientSecret,
        redirectUri,
      });

      return NextResponse.json(tokens);
    } else if (grantType === "refresh_token") {
      const refreshToken = body.get("refresh_token");

      if (!refreshToken) {
        return NextResponse.json(
          { error: "invalid_request", error_description: "Missing refresh_token" },
          { status: 400 }
        );
      }

      const tokens = await OAuth2Service.refreshAccessToken({
        refreshToken,
        clientId,
        clientSecret,
      });

      return NextResponse.json(tokens);
    } else {
      return NextResponse.json(
        { error: "unsupported_grant_type", error_description: "Grant type not supported" },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("Token endpoint error:", err);
    return NextResponse.json(
      { error: "invalid_grant", error_description: err.message || "Failed to process token request" },
      { status: 400 }
    );
  }
}
export const dynamic = "force-dynamic";
