import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { ClientService } from "@/lib/services/client";
import { RBACService } from "@/lib/services/rbac";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roleId: string }> }
) {
  const { id, roleId } = await params;
  const access = await verifyAccess(id);
  if (!access.success) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const body = await request.json();
    const updated = await RBACService.updateRole(roleId, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; roleId: string }> }
) {
  const { id, roleId } = await params;
  const access = await verifyAccess(id);
  if (!access.success) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    await RBACService.deleteRole(roleId);
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
export const dynamic = "force-dynamic";
