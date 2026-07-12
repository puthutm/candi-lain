import { NextResponse, type NextRequest } from "next/server";
import { ReferenceDataService } from "@/lib/services/reference";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryCode: string }> }
) {
  try {
    const { categoryCode } = await params;
    const { searchParams } = new URL(request.url);
    const hierarchy = searchParams.get("hierarchy") === "true";

    const category = await ReferenceDataService.getCategoryByCode(categoryCode);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (hierarchy) {
      const tree = await ReferenceDataService.getItemHierarchy(categoryCode);
      return NextResponse.json({ category, items: tree });
    } else {
      const items = await ReferenceDataService.getItemsByCategory(categoryCode);
      return NextResponse.json({ category, items });
    }
  } catch (err: any) {
    console.error("Reference data GET error:", err);
    return NextResponse.json({ error: "server_error", error_description: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
