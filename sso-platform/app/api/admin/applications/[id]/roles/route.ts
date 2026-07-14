import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { ClientService } from "@/lib/services/client";
import { db } from "@/db";
import { applicationRoles } from "@/db/schema/rbac";
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

// POST: Add a new role
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await verifyAccess(id);
  if (!access.success) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const { roleKey, roleName, description, isDefault } = await request.json();
    if (!roleKey || !roleName) {
      return NextResponse.json({ error: "Role Key and Role Name are required" }, { status: 400 });
    }

    // Insert role
    const [newRole] = await db
      .insert(applicationRoles)
      .values({
        applicationId: id,
        roleKey,
        roleName,
        description: description || null,
        isDefault: !!isDefault,
      })
      .returning();

    return NextResponse.json({ success: true, role: newRole });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await verifyAccess(id);
  if (!access.success) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    if (!roleId) {
      return NextResponse.json({ error: "roleId is required" }, { status: 400 });
    }

    // Delete role (cascades user assignment relationships automatically in PostgreSQL if foreign key has onDelete cascade)
    await db
      .delete(applicationRoles)
      .where(and(eq(applicationRoles.id, roleId), eq(applicationRoles.applicationId, id)));

    return NextResponse.json({ success: true, message: "Role deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
