import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { db } from "@/db";
import { permissions, rolePermissions } from "@/db/schema/rbac";
import { applications } from "@/db/schema/applications";
import { eq, sql } from "drizzle-orm";
import { RBACService } from "@/lib/services/rbac";

export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isSuperAdmin(sessionUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const list = await db
      .select({
        id: permissions.id,
        permissionKey: permissions.permissionKey,
        description: permissions.description,
        applicationId: permissions.applicationId,
        applicationName: applications.name,
        roleCount: sql<number>`(select count(*) from ${rolePermissions} where ${rolePermissions.permissionId} = ${permissions.id})`
      })
      .from(permissions)
      .innerJoin(applications, eq(permissions.applicationId, applications.id));

    return NextResponse.json({ success: true, permissions: list });
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
    const { applicationId, permissionKey, description } = await request.json();
    const permission = await RBACService.createPermission({
      applicationId,
      permissionKey,
      description
    });
    return NextResponse.json({ success: true, permission });
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
    const permissionId = searchParams.get("permissionId");
    if (!permissionId) {
      return NextResponse.json({ error: "permissionId is required" }, { status: 400 });
    }
    await RBACService.deletePermission(permissionId);
    return NextResponse.json({ success: true, message: "Permission deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export const dynamic = "force-dynamic";
