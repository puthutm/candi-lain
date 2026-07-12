import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ClientService } from "@/lib/services/client";
import { AuthenticationService } from "@/lib/services/auth";
import { ConsentService } from "@/lib/services/consent";
import { OAuth2Service } from "@/lib/services/oauth2";
import { parseScopes } from "@/lib/utils";
import { ensureDatabaseSeeded } from "@/lib/seed";

export async function GET(request: NextRequest) {
  try {
    // Ensure database is seeded with applications, users, and roles
    await ensureDatabaseSeeded();

    const { searchParams } = new URL(request.url);
    const responseType = searchParams.get("response_type");
    const clientId = searchParams.get("client_id");
    const redirectUri = searchParams.get("redirect_uri");
    const scope = searchParams.get("scope") || "";
    const state = searchParams.get("state") || "";
    const codeChallenge = searchParams.get("code_challenge");
    const codeChallengeMethod = searchParams.get("code_challenge_method") || "S256";

    // 1. Basic parameter validation
    if (!clientId || !redirectUri || !codeChallenge) {
      return new NextResponse("Missing required parameters (client_id, redirect_uri, code_challenge)", { status: 400 });
    }

    if (responseType !== "code") {
      return NextResponse.redirect(`${redirectUri}?error=unsupported_response_type&state=${encodeURIComponent(state)}`);
    }

    // 2. Client verification
    const app = await ClientService.getApplicationByClientId(clientId);
    if (!app || app.status !== "active") {
      return new NextResponse("Unauthorized client application", { status: 400 });
    }

    // Validate redirect URI against application whitelist
    if (!app.redirectUris.includes(redirectUri)) {
      return new NextResponse("Invalid redirect_uri", { status: 400 });
    }

    // 3. User session check
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sso_session")?.value;
    let sessionUser: any = null;

    if (sessionId) {
      const sessionCheck = await AuthenticationService.validateSession(sessionId);
      if (sessionCheck.valid && sessionCheck.session) {
        sessionUser = sessionCheck.session;
      }
    }

    if (!sessionUser) {
      // Redirect to login page, preserving request URL for post-login return
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("return_to", request.url);
      return NextResponse.redirect(loginUrl.toString());
    }

    // 4. Consent check
    const requestedScopes = parseScopes(scope);
    const consented = await ConsentService.hasActiveConsent(sessionUser.userId, app.id, requestedScopes);

    if (!consented) {
      // Redirect to consent screen
      const consentUrl = new URL("/oauth/consent", request.url);
      consentUrl.searchParams.set("return_to", request.url);
      return NextResponse.redirect(consentUrl.toString());
    }

    // 5. Success: Create authorization code
    try {
      const { code } = await OAuth2Service.createAuthorizationCode({
        userId: sessionUser.userId,
        applicationId: app.id,
        redirectUri,
        scope,
        codeChallenge,
        codeChallengeMethod,
      });

      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.set("code", code);
      if (state) {
        redirectUrl.searchParams.set("state", state);
      }

      return NextResponse.redirect(redirectUrl.toString());
    } catch (err: any) {
      console.error("Error creating authorization code:", err);
      return NextResponse.redirect(`${redirectUri}?error=server_error&state=${encodeURIComponent(state)}`);
    }
  } catch (globalError: any) {
    if (globalError.message === "NEXT_REDIRECT" || globalError.digest?.startsWith("NEXT_REDIRECT")) {
      throw globalError;
    }
    console.error("SSO Auth error:", globalError);
    return NextResponse.json({ error: globalError.message, stack: globalError.stack }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
