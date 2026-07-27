import { NextResponse, type NextRequest } from "next/server";
import { TokenService } from "@/lib/services/token";
import { AuthenticationService } from "@/lib/services/auth";
import { auditQueue } from "@/lib/redis";

/**
 * OIDC Back-Channel Logout Endpoint (RFC 7009 compliant)
 * 
 * Called by the SSO server to notify Relying Parties (applications) that a session has been terminated.
 * This endpoint receives a logout_token (JWT) and the application should invalidate the user's session.
 * 
 * The logout_token is a JWT signed by the SSO server containing:
 * - sub: user identifier
 * - aud: client_id of the application
 * - iat: issued at time
 * - jti: unique token identifier
 * - events: { "http://schemas.openid.net/event/backchannel-logout": {} }
 * - sid: session ID (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/x-www-form-urlencoded")) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Content-Type must be application/x-www-form-urlencoded" },
        { status: 400 }
      );
    }

    const text = await request.text();
    const body = new URLSearchParams(text);
    const logoutToken = body.get("logout_token");

    if (!logoutToken) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Missing logout_token parameter" },
        { status: 400 }
      );
    }

    // Verify the logout token
    const payload = await TokenService.verifyAccessToken(logoutToken);
    if (!payload) {
      return NextResponse.json(
        { error: "invalid_token", error_description: "The logout token is invalid or expired" },
        { status: 401 }
      );
    }

    // Validate that this is a logout token (has the backchannel-logout event)
    const events = payload.events as Record<string, any> | undefined;
    if (!events || !events["http://schemas.openid.net/event/backchannel-logout"]) {
      return NextResponse.json(
        { error: "invalid_token", error_description: "The token is not a valid logout token" },
        { status: 400 }
      );
    }

    const userId = payload.sub as string;
    const clientId = payload.aud as string;
    const sessionId = payload.sid as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "invalid_token", error_description: "Logout token missing subject" },
        { status: 400 }
      );
    }

    // Destroy all sessions for this user
    if (sessionId) {
      // Destroy specific session
      await AuthenticationService.destroySession(sessionId);
    } else {
      // Destroy all sessions for this user in Redis
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
    }

    // Audit log
    await auditQueue.push({
      actorUserId: userId,
      action: "BACKCHANNEL_LOGOUT",
      entityType: "user",
      entityId: userId,
      metadata: {
        clientId,
        sessionId,
        reason: "backchannel_logout",
      },
    });

    // RFC 7009: Respond with 200 OK (empty body)
    return new NextResponse(null, { status: 200 });
  } catch (err: any) {
    console.error("Backchannel logout error:", err);
    // Always return 200 to prevent error propagation to RP
    return new NextResponse(null, { status: 200 });
  }
}

export const dynamic = "force-dynamic";
