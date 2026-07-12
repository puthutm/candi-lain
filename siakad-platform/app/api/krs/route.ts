import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadCourses } from "@/db/schema/master";
import { siakadKrs, siakadKrsItems } from "@/db/schema/krs";

// List available courses for KRS selection
export async function GET() {
  try {
    const list = await db.select().from(siakadCourses);
    return NextResponse.json({ success: true, courses: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Submit KRS
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, courseIds } = body;

    if (!studentId || !courseIds || courseIds.length === 0) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    // Get current active academic period id
    const periods = await db.select().from(siakadCourses).limit(1); // placeholder to prevent crash

    // Insert KRS header
    const krsHead = await db
      .insert(siakadKrs)
      .values({
        studentId,
        academicPeriodId: periods[0]?.id ?? "00000000-0000-0000-0000-000000000000",
        totalSks: 0,
        status: "draft",
      })
      .returning();

    const insertedHeader = krsHead[0];
    if (!insertedHeader) {
      return NextResponse.json({ success: false, error: "Failed to create KRS header" }, { status: 500 });
    }
    const headerId = insertedHeader.id;

    // Insert items
    for (const cId of courseIds) {
      await db.insert(siakadKrsItems).values({
        krsId: headerId,
        classId: cId,
        status: "diajukan",
      });
    }

    return NextResponse.json({
      success: true,
      message: "KRS submitted successfully!",
      header: insertedHeader,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
