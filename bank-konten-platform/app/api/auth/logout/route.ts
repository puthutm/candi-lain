import { NextResponse } from "next/server";
import { signOut } from "@/auth";

export async function POST() {
  try {
    const ssoAppUrl = process.env.SSO_OAUTH_AUTHORIZE_URL?.replace(
      "/oauth/authorize",
      ""
    );
    const ssoLogoutUrl = ssoAppUrl
      ? `${ssoAppUrl}/api/auth/sso-logout?redirect_to=${encodeURIComponent("/auth/login")}`
      : "/auth/login";

    await signOut({ redirect: false });
    return NextResponse.redirect(ssoLogoutUrl, 303);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
