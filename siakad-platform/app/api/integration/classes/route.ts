import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadClasses } from "@/db/schema/classes";
import { siakadCourses } from "@/db/schema/master";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const academicPeriodId = searchParams.get("academicPeriodId");

    if (!academicPeriodId) {
      return NextResponse.json({ error: "academicPeriodId query parameter is required" }, { status: 400 });
    }

    const list = await db
      .select({
        id: siakadClasses.id,
        className: siakadClasses.className,
        dosenUtamaId: siakadClasses.dosenUtamaId,
        courseCode: siakadCourses.code,
        courseName: siakadCourses.name,
        sks: siakadCourses.sks,
      })
      .from(siakadClasses)
      .innerJoin(siakadCourses, eq(siakadClasses.courseId, siakadCourses.id))
      .where(
        and(
          eq(siakadClasses.academicPeriodId, academicPeriodId),
          eq(siakadClasses.status, "aktif")
        )
      );

    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
