import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { db } from "@/db";
import { applications } from "@/db/schema/applications";
import { desc } from "drizzle-orm";

import { applicationRoles } from "@/db/schema/rbac";
import { ClientService } from "@/lib/services/client";

export async function GET(_request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isSuperAdmin(sessionUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const list = await db
      .select({
        id: applications.id,
        clientId: applications.clientId,
        name: applications.name,
        description: applications.description,
        redirectUris: applications.redirectUris,
        allowedGrantTypes: applications.allowedGrantTypes,
        status: applications.status,
        createdAt: applications.createdAt,
      })
      .from(applications)
      .orderBy(desc(applications.createdAt));

    return NextResponse.json({ success: true, clients: list });
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
    const body = await request.json();
    const { name, description, redirectUris, logoUrl, roles } = body;

    if (!name || !redirectUris || !Array.isArray(redirectUris) || redirectUris.length === 0) {
      return NextResponse.json({ error: "Nama Aplikasi dan Redirect URIs wajib diisi" }, { status: 400 });
    }

    const { application, rawSecret } = await ClientService.createApplication({
      name,
      description,
      redirectUris,
      logoUrl,
      ownerUserId: sessionUser.id,
    });

    // Create default application roles if specified
    if (roles && Array.isArray(roles)) {
      for (const r of roles) {
        if (r && typeof r === "string") {
          await db.insert(applicationRoles).values({
            applicationId: application.id,
            roleKey: r.toLowerCase(),
            roleName: r,
            description: `Role ${r} untuk aplikasi ${application.name}`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      application,
      clientId: application.clientId,
      clientSecret: rawSecret,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
