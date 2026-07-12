import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadCourses } from "@/db/schema/master";
import { siakadKrsHeader, siakadKrsItems } from "@/db/schema/krs";
import { siakadStudents } from "@/db/schema/civitas";
import { eq } from "drizzle-orm";

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
      .insert(siakadKrsHeader)
      .values({
        studentId,
        academicPeriodId: "20261", // Ganjil 2026/2027 placeholder UUID
        totalSksApproved: 0,
        approvalStatus: "draft",
      })
      .returning();

    const headerId = krsHead[0].id;

    // Insert items
    for (const cId of courseIds) {
      await db.insert(siakadKrsItems).values({
        krsHeaderId: headerId,
        courseId: cId,
        status: "pending",
      });
    }

    return NextResponse.json({
      success: true,
      message: "KRS submitted successfully!",
      header: krsHead[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
