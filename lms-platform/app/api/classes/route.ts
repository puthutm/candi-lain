import { NextResponse } from "next/server";
import { db } from "@/db";
import { lmsClasses } from "@/db/schema/classes";

export async function GET() {
  try {
    const list = await db.select().from(lmsClasses);
    return NextResponse.json({ success: true, classes: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
