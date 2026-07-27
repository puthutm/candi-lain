import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { ClientService } from "@/lib/services/client";
import { db } from "@/db";
import { applications } from "@/db/schema/applications";
import { eq } from "drizzle-orm";

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

  return NextResponse.json(access.app);
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
    const updated = await ClientService.updateApplication(id, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(
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
    
    // Handle token lifetime updates specifically
    const updateData: Record<string, any> = {};
    
    if (body.accessTokenLifetime !== undefined) {
      const lifetime = parseInt(body.accessTokenLifetime);
      if (isNaN(lifetime) || lifetime < 300 || lifetime > 86400) {
        return NextResponse.json(
          { error: "accessTokenLifetime must be between 300 (5 min) and 86400 (24 hours)" },
          { status: 400 }
        );
      }
      updateData.accessTokenLifetime = lifetime;
    }
    
    if (body.refreshTokenLifetime !== undefined) {
      const lifetime = parseInt(body.refreshTokenLifetime);
      if (isNaN(lifetime) || lifetime < 3600 || lifetime > 2592000) {
        return NextResponse.json(
          { error: "refreshTokenLifetime must be between 3600 (1 hour) and 2592000 (30 days)" },
          { status: 400 }
        );
      }
      updateData.refreshTokenLifetime = lifetime;
    }
    
    if (body.isPublicClient !== undefined) {
      updateData.isPublicClient = Boolean(body.isPublicClient);
    }
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.redirectUris !== undefined) updateData.redirectUris = body.redirectUris;
    if (body.allowedGrantTypes !== undefined) updateData.allowedGrantTypes = body.allowedGrantTypes;
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl;
    if (body.status !== undefined) updateData.status = body.status;
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await ClientService.updateApplication(id, updateData);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Delete application
    await db.delete(applications).where(eq(applications.id, id));
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
