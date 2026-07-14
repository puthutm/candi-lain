import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { ClientService } from "@/lib/services/client";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { userApplicationRoles, applicationRoles } from "@/db/schema/rbac";
import { eq, and } from "drizzle-orm";

async function verifyAccess(appId: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, status: 401, error: "Unauthorized" };

  const app = await ClientService.getApplicationById(appId);
  if (!app) return { success: false, status: 404, error: "Application not found" };

  if (isSuperAdmin(user) || app.ownerUserId === user.id) {
    return { success: true, app, user };
  }

  return { success: false, status: 403, error: "Forbidden" };
}

// GET: Fetch all users list (available for assignment dropdown)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await verifyAccess(id);
  if (!access.success || !access.user) {
    return NextResponse.json({ error: access.error || "Unauthorized" }, { status: access.status || 401 });
  }

  try {
    // Fetch all active users
    const allUsers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        username: users.username,
      })
      .from(users)
      .where(eq(users.status, "active"));

    return NextResponse.json({ success: true, users: allUsers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Assign user to role
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await verifyAccess(id);
  if (!access.success || !access.user) {
    return NextResponse.json({ error: access.error || "Unauthorized" }, { status: access.status || 401 });
  }

  try {
    const { userId, roleId } = await request.json();
    if (!userId || !roleId) {
      return NextResponse.json({ error: "userId and roleId are required" }, { status: 400 });
    }

    // Check if role exists and belongs to this application
    const [role] = await db
      .select()
      .from(applicationRoles)
      .where(and(eq(applicationRoles.id, roleId), eq(applicationRoles.applicationId, id)))
      .limit(1);

    if (!role) {
      return NextResponse.json({ error: "Role not found for this application" }, { status: 404 });
    }

    // Check if user is already assigned to a role in this app
    const [existing] = await db
      .select()
      .from(userApplicationRoles)
      .where(
        and(
          eq(userApplicationRoles.userId, userId),
          eq(userApplicationRoles.applicationId, id),
          eq(userApplicationRoles.status, "active")
        )
      )
      .limit(1);

    if (existing) {
      // Update role mapping instead of duplicate insert, or notify
      await db
        .update(userApplicationRoles)
        .set({ roleId, grantedBy: access.user.id, grantedAt: new Date() })
        .where(eq(userApplicationRoles.id, existing.id));

      return NextResponse.json({ success: true, message: "User role assignment updated" });
    }

    // Insert new assignment
    const [newAsg] = await db
      .insert(userApplicationRoles)
      .values({
        userId,
        applicationId: id,
        roleId,
        grantedBy: access.user.id,
        status: "active",
      })
      .returning();

    return NextResponse.json({ success: true, assignment: newAsg });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Revoke user assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await verifyAccess(id);
  if (!access.success || !access.user) {
    return NextResponse.json({ error: access.error || "Unauthorized" }, { status: access.status || 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
    }

    // Revoke by setting status to revoked (or delete it)
    await db
      .update(userApplicationRoles)
      .set({ status: "revoked" })
      .where(and(eq(userApplicationRoles.id, assignmentId), eq(userApplicationRoles.applicationId, id)));

    return NextResponse.json({ success: true, message: "Role assignment revoked successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
