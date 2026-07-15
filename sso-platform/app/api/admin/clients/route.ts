import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { db } from "@/db";
import { applications } from "@/db/schema/applications";
import { desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
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

export const dynamic = "force-dynamic";
