import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadAcademicPeriods, siakadCurricula, siakadCourses, siakadStudyPrograms } from "@/db/schema/master";
import { siakadClasses, siakadClassSchedules } from "@/db/schema/classes";
import { ensureSiakadSeeded } from "@/db/seed";

export async function GET(request: Request) {
  try {
    await ensureSiakadSeeded();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";

    if (type === "periode") {
      const periods = await db.select().from(siakadAcademicPeriods);
      return NextResponse.json({ success: true, data: periods });
    }

    if (type === "kurikulum") {
      const curricula = await db.select().from(siakadCurricula);
      return NextResponse.json({ success: true, data: curricula });
    }

    if (type === "matakuliah") {
      const courses = await db.select().from(siakadCourses);
      return NextResponse.json({ success: true, data: courses });
    }

    if (type === "kelas") {
      const classes = await db.select().from(siakadClasses);
      return NextResponse.json({ success: true, data: classes });
    }

    if (type === "jadwal") {
      const schedules = await db.select().from(siakadClassSchedules).limit(16);
      return NextResponse.json({ success: true, data: schedules });
    }

    // Default overview bundle
    const [periods, curricula, courses, classes, prodis] = await Promise.all([
      db.select().from(siakadAcademicPeriods),
      db.select().from(siakadCurricula),
      db.select().from(siakadCourses),
      db.select().from(siakadClasses),
      db.select().from(siakadStudyPrograms),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        periods,
        curricula,
        courses,
        classes,
        prodis,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
