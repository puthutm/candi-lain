import { NextResponse } from "next/server";
import { db } from "@/db";
import { ssoUsers, ssoApplications, ssoApplicationRoles, ssoUserApplicationRoles, ssoOauthAuthorizationCodes } from "@/db/schema/sso";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ success: false, error: "Missing authorization code" }, { status: 400 });
    }

    // 1. Fetch code details from SSO tables
    const codesList = await db
      .select()
      .from(ssoOauthAuthorizationCodes)
      .where(eq(ssoOauthAuthorizationCodes.code, code))
      .limit(1);

    if (codesList.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid authorization code" }, { status: 400 });
    }

    const codeRecord = codesList[0]!;

    if (codeRecord.used) {
      return NextResponse.json({ success: false, error: "Authorization code already used" }, { status: 400 });
    }

    if (new Date() > new Date(codeRecord.expiresAt)) {
      return NextResponse.json({ success: false, error: "Authorization code has expired" }, { status: 400 });
    }

    // Mark code as used
    await db
      .update(ssoOauthAuthorizationCodes)
      .set({ used: true })
      .where(eq(ssoOauthAuthorizationCodes.id, codeRecord.id));

    // 2. Fetch user profile
    const usersList = await db
      .select()
      .from(ssoUsers)
      .where(eq(ssoUsers.id, codeRecord.userId))
      .limit(1);

    if (usersList.length === 0) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 });
    }

    const user = usersList[0]!;

    // 3. Resolve user role for bank-konten-platform
    const appList = await db
      .select()
      .from(ssoApplications)
      .where(eq(ssoApplications.clientId, process.env.SSO_OAUTH_CLIENT_ID || "bank-konten-platform"))
      .limit(1);

    let role = "dosen"; // fallback

    if (appList.length > 0) {
      const app = appList[0]!;
      const userRolesList = await db
        .select()
        .from(ssoUserApplicationRoles)
        .where(
          and(
            eq(ssoUserApplicationRoles.userId, user.id),
            eq(ssoUserApplicationRoles.applicationId, app.id),
            eq(ssoUserApplicationRoles.status, "active")
          )
        )
        .limit(1);

      if (userRolesList.length > 0) {
        const roleDetailsList = await db
          .select()
          .from(ssoApplicationRoles)
          .where(eq(ssoApplicationRoles.id, userRolesList[0]!.roleId))
          .limit(1);

        if (roleDetailsList.length > 0) {
          role = roleDetailsList[0]!.roleKey;
        }
      }
    }

    // 4. Save session cookie
    const cookieStore = await cookies();
    cookieStore.set("bank_user", JSON.stringify({
      userId: user.id,
      name: user.fullName,
      username: user.username,
      role,
    }), {
      path: "/",
      maxAge: 86400,
    });

    // 5. Redirect back to homepage
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
