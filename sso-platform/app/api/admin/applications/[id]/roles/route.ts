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
    const roles = await RBACService.getRolesByApplication(id);
    return NextResponse.json(roles);
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
    const { roleKey, roleName, description, isDefault } = body;

    if (!roleKey || !roleName) {
      return NextResponse.json({ error: "Missing required fields (roleKey, roleName)" }, { status: 400 });
    }

    const role = await RBACService.createRole({
      applicationId: id,
      roleKey,
      roleName,
      description,
      isDefault,
    });

    return NextResponse.json(role);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
export const dynamic = "force-dynamic";
