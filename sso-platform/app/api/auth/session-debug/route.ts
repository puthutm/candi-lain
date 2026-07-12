import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthenticationService } from "@/lib/services/auth";
import { env } from "@/lib/env";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // NOTE: cookies() in Next.js reads cookies sent by the client for THIS request.
    const sessionCookie = allCookies.find((c) => c.name === "sso_session");
    const sessionId = sessionCookie?.value;

    if (!sessionId) {
      return NextResponse.json({
        ok: true,
        hasCookie: false,
        sessionValid: false,
        sessionCookieSecureEnv: env.SESSION_COOKIE_SECURE,
        // Debug: show cookie names received by server for this request
        receivedCookieNames: allCookies.map((c) => c.name),
      });
    }

    const validation = await AuthenticationService.validateSession(sessionId);

    return NextResponse.json({
      ok: true,
      hasCookie: true,
      sessionIdPresent: true,
      sessionValid: validation.valid,
      session: validation.valid ? validation.session : null,
      sessionCookieSecureEnv: env.SESSION_COOKIE_SECURE,
      // Debug: cookie names received by server for this request
      receivedCookieNames: allCookies.map((c) => c.name),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
