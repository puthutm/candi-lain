import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { ReferenceDataService } from "@/lib/services/reference";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const list = await ReferenceDataService.getOrganizationHierarchy();
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
    const { code, name, parentId, type, isActive } = body;

    if (!code || !name || !type) {
      return NextResponse.json({ error: "Missing required fields (code, name, type)" }, { status: 400 });
    }

    const org = await ReferenceDataService.createOrganization({
      code,
      name,
      parentId,
      type,
      isActive,
    });

    return NextResponse.json(org);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
export const dynamic = "force-dynamic";
