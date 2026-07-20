import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthenticationService } from "@/lib/services/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect_to") || "/";

  let sessionId: string | undefined;
  try {
    const cookieStore = await cookies();
    sessionId = cookieStore.get("sso_session")?.value;
  } catch {
    // ignore cookie read errors
  }

  if (sessionId) {
    try {
      await AuthenticationService.destroySession(sessionId);
    } catch {
      // best-effort destroy
    }
  }

  try {
    (await cookies()).delete("sso_session");
  } catch {
    // ignore
  }

  return NextResponse.redirect(redirectTo);
}

export const dynamic = "force-dynamic";
