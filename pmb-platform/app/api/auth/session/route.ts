import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { pmbApplicants } from "@/db/schema/applicants";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { ALL_PMB_ROLES, getRoleDisplayName } from "@/lib/sso-middleware";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: true, authenticated: false, user: null });
    }

    const email = session.user.email?.toLowerCase();
    let userPayload = { ...session.user } as any;

    // Check if user is an SSO admin with PMB role
    const ssoRole = (session.user as any).role as string;
    const isPmbAdmin = ssoRole && ALL_PMB_ROLES.includes(ssoRole as any);

    if (isPmbAdmin) {
      // This is an SSO admin user with PMB role
      userPayload.role = ssoRole;
      userPayload.roleDisplayName = getRoleDisplayName(ssoRole as any);
      userPayload.isAdmin = true;
      userPayload.staffId = (session.user as any).id;

      // Write admin cookie for legacy API routes
      const cookieStore = await cookies();
      cookieStore.set(
        "pmb_user",
        JSON.stringify({
          userId: (session.user as any).id,
          name: session.user.name,
          role: ssoRole,
          isAdmin: true,
        }),
        { path: "/", maxAge: 86400 }
      );
    } else if (email) {
      // Check if user is an applicant
      const applicantRows = await db
        .select()
        .from(pmbApplicants)
        .where(eq(pmbApplicants.email, email))
        .limit(1);

      const applicant = applicantRows[0];
      if (applicant) {
        // Map SSO role and ID to applicant format for client-side
        userPayload.role = "applicant";
        userPayload.userId = applicant.id;
        userPayload.registrationNumber = applicant.registrationNumber;

        // Also write legacy cookie to support other API routes
        const cookieStore = await cookies();
        cookieStore.set(
          "pmb_user",
          JSON.stringify({
            userId: applicant.id,
            name: applicant.fullName,
            role: "applicant",
            registrationNumber: applicant.registrationNumber,
          }),
          { path: "/", maxAge: 86400 }
        );
      }
    }

    return NextResponse.json({ success: true, authenticated: true, user: userPayload });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
