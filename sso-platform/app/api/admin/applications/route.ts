import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { ClientService } from "@/lib/services/client";
import { db } from "@/db";
import { applications } from "@/db/schema/applications";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const list = await db.select().from(applications);
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, redirectUris, allowedGrantTypes, logoUrl } = body;

    if (!name || !redirectUris || !Array.isArray(redirectUris)) {
      return NextResponse.json({ error: "Missing required fields (name, redirectUris)" }, { status: 400 });
    }

    const result = await ClientService.createApplication({
      name,
      description,
      redirectUris,
      allowedGrantTypes,
      logoUrl,
      ownerUserId: user.id,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
export const dynamic = "force-dynamic";
