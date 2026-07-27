import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthenticationService } from "@/lib/services/auth";
import { TokenService } from "@/lib/services/token";
import { ClientService } from "@/lib/services/client";
import { isRedirectUriAllowed } from "@/lib/utils";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  
  // OIDC RP-Initiated Logout parameters
  const idTokenHint = url.searchParams.get("id_token_hint");
  const postLogoutRedirectUri = url.searchParams.get("post_logout_redirect_uri");
  const state = url.searchParams.get("state") || "";
  
  // Fallback to legacy parameters
  const redirectUri = postLogoutRedirectUri || url.searchParams.get("redirect_uri") || url.searchParams.get("redirect_to") || "/";

  let sessionId: string | undefined;
  let userId: string | undefined;

  try {
    const cookieStore = await cookies();
    sessionId = cookieStore.get("sso_session")?.value;
  } catch {
    // ignore cookie read errors
  }

  // If id_token_hint is provided, validate it and extract user info
  if (idTokenHint) {
    try {
      const payload = await TokenService.verifyAccessToken(idTokenHint);
      if (payload && payload.sub) {
        userId = payload.sub as string;
      }
    } catch {
      // Invalid id_token_hint, ignore
    }
  }

  // Get session user if available
  if (sessionId) {
    try {
      const sessionCheck = await AuthenticationService.validateSession(sessionId);
      if (sessionCheck.valid && sessionCheck.session) {
        userId = sessionCheck.session.userId;
      }
    } catch {
      // best-effort
    }
  }

  // Destroy session
  if (sessionId) {
    try {
      await AuthenticationService.destroySession(sessionId);
    } catch {
      // best-effort destroy
    }
  }

  // Revoke all tokens for user if we have their ID
  if (userId) {
    try {
      // Revoke all active sessions for this user in Redis
      let cursor = "0";
      const { redis } = await import("@/lib/redis");
      const sessionPattern = "auth:session:*";
      do {
        const [newCursor, keys] = await redis.scan(cursor, "MATCH", sessionPattern, "COUNT", 100);
        cursor = newCursor;
        for (const key of keys) {
          const sessionData = await redis.get(key);
          if (sessionData) {
            const parsed = JSON.parse(sessionData);
            if (parsed.userId === userId) {
              await redis.del(key);
            }
          }
        }
      } while (cursor !== "0");
    } catch {
      // best-effort
    }
  }

  // Clear SSO session cookie
  try {
    const cookieStore = await cookies();
    cookieStore.delete("sso_session");
  } catch {
    // ignore
  }

  // Validate post_logout_redirect_uri if provided (OIDC RP-Initiated Logout)
  let finalRedirectUri = redirectUri;
  if (postLogoutRedirectUri && idTokenHint) {
    try {
      // Try to validate against known client redirect URIs
      const payload = await TokenService.verifyAccessToken(idTokenHint);
      if (payload && payload.aud) {
        const clientId = payload.aud as string;
        const app = await ClientService.getApplicationByClientId(clientId);
        if (app && isRedirectUriAllowed(app.redirectUris, postLogoutRedirectUri)) {
          finalRedirectUri = postLogoutRedirectUri;
          if (state) {
            const redirectUrl = new URL(finalRedirectUri);
            redirectUrl.searchParams.set("state", state);
            finalRedirectUri = redirectUrl.toString();
          }
        }
      }
    } catch {
      // If validation fails, use default redirect
      finalRedirectUri = env.NEXT_PUBLIC_APP_URL || "/";
    }
  }

  return NextResponse.redirect(finalRedirectUri);
}

export const dynamic = "force-dynamic";
