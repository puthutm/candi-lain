import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthenticationService } from "@/lib/services/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sso_session")?.value;

    if (!sessionId) {
      return NextResponse.json({
        ok: true,
        hasCookie: false,
        sessionValid: false,
      });
    }

    const validation = await AuthenticationService.validateSession(sessionId);

    return NextResponse.json({
      ok: true,
      hasCookie: true,
      sessionValid: validation.valid,
      session: validation.valid ? validation.session : null,
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
