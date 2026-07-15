import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { db } from "@/db";
import { applicationRoles, userApplicationRoles, rolePermissions } from "@/db/schema/rbac";
import { applications } from "@/db/schema/applications";
import { eq, sql } from "drizzle-orm";
import { RBACService } from "@/lib/services/rbac";

export async function GET(_request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isSuperAdmin(sessionUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const list = await db
      .select({
        id: applicationRoles.id,
        roleKey: applicationRoles.roleKey,
        roleName: applicationRoles.roleName,
        description: applicationRoles.description,
        isDefault: applicationRoles.isDefault,
        createdAt: applicationRoles.createdAt,
        applicationId: applicationRoles.applicationId,
        applicationName: applications.name,
        userCount: sql<number>`(select count(*) from ${userApplicationRoles} where ${userApplicationRoles.roleId} = ${applicationRoles.id} and ${userApplicationRoles.status} = 'active')`,
        permissionCount: sql<number>`(select count(*) from ${rolePermissions} where ${rolePermissions.roleId} = ${applicationRoles.id})`
      })
      .from(applicationRoles)
      .innerJoin(applications, eq(applicationRoles.applicationId, applications.id));

    return NextResponse.json({ success: true, roles: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isSuperAdmin(sessionUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { applicationId, roleKey, roleName, description, isDefault } = await request.json();
    const role = await RBACService.createRole({
      applicationId,
      roleKey,
      roleName,
      description,
      isDefault
    });
    return NextResponse.json({ success: true, role });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isSuperAdmin(sessionUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { roleId, roleName, description, isDefault } = await request.json();
    const role = await RBACService.updateRole(roleId, {
      roleName,
      description,
      isDefault
    });
    return NextResponse.json({ success: true, role });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isSuperAdmin(sessionUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");
    if (!roleId) {
      return NextResponse.json({ error: "roleId is required" }, { status: 400 });
    }
    await RBACService.deleteRole(roleId);
    return NextResponse.json({ success: true, message: "Role deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export const dynamic = "force-dynamic";
