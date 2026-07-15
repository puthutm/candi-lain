import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { db } from "@/db";
import { rolePermissions, permissions, applicationRoles } from "@/db/schema/rbac";
import { eq, and } from "drizzle-orm";
import { RBACService } from "@/lib/services/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isSuperAdmin(sessionUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id: roleId } = await params;

    // Fetch the role to get its applicationId
    const [role] = await db
      .select()
      .from(applicationRoles)
      .where(eq(applicationRoles.id, roleId))
      .limit(1);

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Fetch active mappings
    const active = await db
      .select({
        id: permissions.id,
        permissionKey: permissions.permissionKey,
        description: permissions.description
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    // Fetch all permissions for this application
    const available = await db
      .select()
      .from(permissions)
      .where(eq(permissions.applicationId, role.applicationId));

    return NextResponse.json({
      success: true,
      active,
      available
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isSuperAdmin(sessionUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id: roleId } = await params;
    const { permissionId } = await request.json();

    if (!permissionId) {
      return NextResponse.json({ error: "permissionId is required" }, { status: 400 });
    }

    await RBACService.assignPermissionToRole(roleId, permissionId);
    return NextResponse.json({ success: true, message: "Permission assigned to role successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isSuperAdmin(sessionUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id: roleId } = await params;
    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get("permissionId");

    if (!permissionId) {
      return NextResponse.json({ error: "permissionId is required" }, { status: 400 });
    }

    await RBACService.removePermissionFromRole(roleId, permissionId);
    return NextResponse.json({ success: true, message: "Permission removed from role successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export const dynamic = "force-dynamic";
