import { NextResponse } from "next/server";
import { ensureSiakadSeeded } from "@/db/seed";

export async function GET() {
  try {
    await ensureSiakadSeeded();
    return NextResponse.json({ success: true, message: "Database SIAKAD seeded successfully!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
