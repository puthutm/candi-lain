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

  // Auth.js v5 signIn triggers PKCE/state creation and redirects to provider authorization endpoint.
  // Use NextAuth's built-in signIn redirect flow.
  await signIn("unsia-sso", { redirectTo });

  // signIn normally redirects; keep fallback.
  return NextResponse.json({ success: true });
}

export const dynamic = "force-dynamic";
