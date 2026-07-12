import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { ClientService } from "@/lib/services/client";
import { RBACService } from "@/lib/services/rbac";
import { db } from "@/db";
import { userApplicationRoles, applicationRoles } from "@/db/schema/rbac";
import { users } from "@/db/schema/users";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await verifyAccess(id);
  if (!access.success) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const list = await db
      .select({
        id: userApplicationRoles.id,
        userId: userApplicationRoles.userId,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        roleId: userApplicationRoles.roleId,
        roleKey: applicationRoles.roleKey,
        roleName: applicationRoles.roleName,
        grantedAt: userApplicationRoles.grantedAt,
        status: userApplicationRoles.status,
      })
      .from(userApplicationRoles)
      .innerJoin(users, eq(userApplicationRoles.userId, users.id))
      .innerJoin(applicationRoles, eq(userApplicationRoles.roleId, applicationRoles.id))
      .where(
        and(
          eq(userApplicationRoles.applicationId, id),
          eq(userApplicationRoles.status, "active")
        )
      );

    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
    const body = await request.json();
    const { userId, roleId } = body;

    if (!userId || !roleId) {
      return NextResponse.json({ error: "Missing required fields (userId, roleId)" }, { status: 400 });
    }

    const userRole = await RBACService.assignRoleToUser({
      userId,
      applicationId: id,
      roleId,
      grantedBy: access.user.id,
    });

    return NextResponse.json(userRole);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

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
    const userId = searchParams.get("userId");
    const roleId = searchParams.get("roleId");

    if (!userId || !roleId) {
      return NextResponse.json({ error: "Missing userId or roleId search parameters" }, { status: 400 });
    }

    await RBACService.revokeRoleFromUser(userId, id, roleId);
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
export const dynamic = "force-dynamic";
