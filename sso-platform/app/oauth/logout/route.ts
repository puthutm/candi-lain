import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthenticationService } from "@/lib/services/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUri = url.searchParams.get("redirect_uri") || url.searchParams.get("redirect_to") || "/";

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
    const cookieStore = await cookies();
    cookieStore.delete("sso_session");
  } catch {
    // ignore
  }

  return NextResponse.redirect(redirectUri);
}

export const dynamic = "force-dynamic";
