import { NextResponse, type NextRequest } from "next/server";
import { ensureDatabaseSeeded } from "@/lib/seed";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    await ensureDatabaseSeeded(force);
    return NextResponse.json({ success: true, message: "SSO Platform Database seeded successfully!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
