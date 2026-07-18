import { NextResponse } from "next/server";
import { signIn } from "@/auth";
import { env } from "@/lib/env";

export async function GET() {
  // Note: cookie state/pkce will be created by Auth.js during signIn() call.
  if (!env.AUTH_SECRET && !env.NEXTAUTH_SECRET) {
    console.error("[pmb][auth][login] missing secret config", {
      hasAUTH_SECRET: Boolean(env.AUTH_SECRET),
      hasNEXTAUTH_SECRET: Boolean(env.NEXTAUTH_SECRET),
    });
    return NextResponse.json(
      { success: false, error: "AUTH_SECRET/NEXTAUTH_SECRET is not configured" },
      { status: 500 }
    );
  }

  // Keep redirect inside PMB
  const redirectTo = "/";

  console.info("[pmb][auth][login] starting signIn", {
    provider: "unsia-sso",
    redirectTo,
    hasAUTH_SECRET: Boolean(env.AUTH_SECRET),
    hasNEXTAUTH_SECRET: Boolean(env.NEXTAUTH_SECRET),
  });

  // Important: return the redirect Response from signIn so cookies are set on the browser.
  const result = await signIn("unsia-sso", { redirectTo });

  // Some auth.js versions return a Response, others return void; handle both.
  if (result instanceof Response) {
    const setCookie = result.headers.get("set-cookie") || "";
    console.info("[pmb][auth][login] signIn returned Response", {
      hasSetCookieState: setCookie.includes("pmb.authjs.state="),
      hasSetCookiePkce: setCookie.includes("pmb.authjs.pkce.code_verifier="),
    });
    return result;
  }

  console.info("[pmb][auth][login] signIn returned non-Response", { type: typeof result });
  return NextResponse.json({ success: true });
}

export const dynamic = "force-dynamic";
