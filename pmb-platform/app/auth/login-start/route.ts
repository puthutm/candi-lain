import { NextResponse } from "next/server";
import { signIn } from "@/auth";
import { env } from "@/lib/env";

export async function GET() {
  if (!env.AUTH_SECRET && !env.NEXTAUTH_SECRET) {
    return NextResponse.json(
      { success: false, error: "AUTH_SECRET/NEXTAUTH_SECRET is not configured" },
      { status: 500 }
    );
  }

  const redirectTo = "/";

  console.info("[pmb][auth][login-start] starting signIn", {
    provider: "unsia-sso",
    redirectTo,
    hasAUTH_SECRET: Boolean(env.AUTH_SECRET),
    hasNEXTAUTH_SECRET: Boolean(env.NEXTAUTH_SECRET),
  });

  // Return the response from signIn so Set-Cookie is applied by the browser.
  const result = await signIn("unsia-sso", { redirectTo });

  // next-auth/Auth.js v5 beta types may not narrow to global Response cleanly in TS,
  // so we use a duck-typing check.
  const maybeResponse = result as any;
  const isResponseLike =
    maybeResponse &&
    typeof maybeResponse === "object" &&
    maybeResponse.headers &&
    typeof maybeResponse.headers.get === "function";

  if (isResponseLike) {
    const setCookie = maybeResponse.headers.get("set-cookie") || "";
    console.info("[pmb][auth][login-start] signIn Response cookie flags", {
      hasSetCookieState: setCookie.includes("pmb.authjs.state="),
      hasSetCookiePkce: setCookie.includes("pmb.authjs.pkce.code_verifier="),
    });
    return maybeResponse as Response;
  }

  return NextResponse.json({ success: true });
}

export const dynamic = "force-dynamic";
