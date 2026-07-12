import { NextResponse } from "next/server";
import { ensurePmbSeeded } from "@/db/seed";

export async function GET() {
  try {
    await ensurePmbSeeded();
    return NextResponse.json({ success: true, message: "Database Master and Mock Applicants seeded successfully!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
