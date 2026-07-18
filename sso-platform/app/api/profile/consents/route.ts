import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth-helper";
import { db } from "@/db";
import { oauthConsents } from "@/db/schema/oauth";
import { applications } from "@/db/schema/applications";
import { eq, and, isNull } from "drizzle-orm";

// GET: Retrieve all active consents for the logged-in user
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeConsents = await db
      .select({
        id: oauthConsents.id,
        scope: oauthConsents.scope,
        grantedAt: oauthConsents.grantedAt,
        appId: applications.id,
        appName: applications.name,
        appDescription: applications.description,
        appLogo: applications.logoUrl,
        clientId: applications.clientId,
      })
      .from(oauthConsents)
      .innerJoin(applications, eq(oauthConsents.applicationId, applications.id))
      .where(
        and(
          eq(oauthConsents.userId, user.id),
          isNull(oauthConsents.revokedAt)
        )
      );

    return NextResponse.json({ success: true, consents: activeConsents });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Revoke a specific consent
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const consentId = searchParams.get("consentId");

    if (!consentId) {
      return NextResponse.json({ error: "consentId parameter is required" }, { status: 400 });
    }

    // Set revokedAt to current timestamp to revoke consent
    await db
      .update(oauthConsents)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(oauthConsents.id, consentId),
          eq(oauthConsents.userId, user.id)
        )
      );

    return NextResponse.json({ success: true, message: "Consent revoked successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
