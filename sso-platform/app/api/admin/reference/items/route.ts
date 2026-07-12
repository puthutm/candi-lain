import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { ReferenceDataService } from "@/lib/services/reference";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { categoryId, parentId, code, name, extraValue, sortOrder, isActive } = body;

    if (!categoryId || !code || !name) {
      return NextResponse.json({ error: "Missing required fields (categoryId, code, name)" }, { status: 400 });
    }

    const item = await ReferenceDataService.createItem({
      categoryId,
      parentId,
      code,
      name,
      extraValue,
      sortOrder,
      isActive,
    });

    return NextResponse.json(item);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
export const dynamic = "force-dynamic";
