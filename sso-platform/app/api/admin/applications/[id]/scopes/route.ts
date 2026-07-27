import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { ClientService } from "@/lib/services/client";
import { db } from "@/db";
import { applicationScopes } from "@/db/schema/applications";
import { eq } from "drizzle-orm";
import { auditQueue } from "@/lib/redis";

async function verifyAccess(appId: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, status: 401, error: "Unauthorized" };

  const app = await ClientService.getApplicationById(appId);
  if (!app) return { success: false, status: 404, error: "Application not found" };

  if (isSuperAdmin(user) || app.ownerUserId === user.id) {
    return { success: true };
  }

  return { success: false, status: 403, error: "Forbidden" };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await verifyAccess(id);
  if (!access.success) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const body = await request.json();
    const { scopeIds } = body;

    if (!Array.isArray(scopeIds)) {
      return NextResponse.json({ error: "scopeIds must be an array" }, { status: 400 });
    }

    // Replace all scope assignments for this application
    await db.transaction(async (tx) => {
      // Remove existing assignments
      await tx
        .delete(applicationScopes)
        .where(eq(applicationScopes.applicationId, id));

      // Insert new assignments
      if (scopeIds.length > 0) {
        await tx.insert(applicationScopes).values(
          scopeIds.map((scopeId: string) => ({
            applicationId: id,
            scopeId,
          }))
        );
      }
    });

    await auditQueue.push({
      actorUserId: "system",
      action: "APPLICATION_SCOPES_UPDATED",
      entityType: "application",
      entityId: id,
      metadata: { scopeIds },
    });

    return NextResponse.json({ success: true, message: "Scope assignments updated successfully" });
  } catch (err: any) {
    console.error("Failed to update scope assignments:", err);
    return NextResponse.json({ error: "Failed to update scope assignments" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await verifyAccess(id);
  if (!access.success) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const assignedScopes = await db
      .select({
        id: applicationScopes.scopeId,
      })
      .from(applicationScopes)
      .where(eq(applicationScopes.applicationId, id));

    return NextResponse.json({ scopeIds: assignedScopes.map((s) => s.id) });
  } catch (err: any) {
    console.error("Failed to fetch assigned scopes:", err);
    return NextResponse.json({ error: "Failed to fetch assigned scopes" }, { status: 500 });
  }
}
