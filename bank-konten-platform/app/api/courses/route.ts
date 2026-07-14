import { NextResponse } from "next/server";
import { db } from "@/db";
import { bankCourses } from "@/db/schema/content";

export async function GET() {
  try {
    const list = await db.select().from(bankCourses);
    return NextResponse.json({ success: true, courses: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
