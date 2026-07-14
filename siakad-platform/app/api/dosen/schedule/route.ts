import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { siakadLecturers } from "@/db/schema/civitas";
import { siakadClasses, siakadClassSchedules } from "@/db/schema/classes";
import { siakadCourses, siakadAcademicPeriods, siakadStudyPrograms } from "@/db/schema/master";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("siakad_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);

    // Find lecturer by SSO userId
    const [lecturer] = await db
      .select()
      .from(siakadLecturers)
      .where(eq(siakadLecturers.userId, sessionUser.userId))
      .limit(1);

    if (!lecturer) {
      return NextResponse.json({ success: true, lecturer: null, classes: [] });
    }

    // Get study program name
    let studyProgramName = "";
    if (lecturer.studyProgramId) {
      const [sp] = await db
        .select({ name: siakadStudyPrograms.name })
        .from(siakadStudyPrograms)
        .where(eq(siakadStudyPrograms.id, lecturer.studyProgramId))
        .limit(1);
      studyProgramName = sp?.name || "";
    }

    // Get active period
    const [activePeriod] = await db
      .select()
      .from(siakadAcademicPeriods)
      .where(eq(siakadAcademicPeriods.status, "berjalan"))
      .limit(1);

    if (!activePeriod) {
      return NextResponse.json({
        success: true,
        lecturer: { ...lecturer, studyProgramName },
        classes: [],
        period: null,
      });
    }

    // Get classes where this lecturer is the main instructor
    const classes = await db
      .select({
        classId: siakadClasses.id,
        className: siakadClasses.className,
        courseCode: siakadCourses.code,
        courseName: siakadCourses.name,
        sks: siakadCourses.sks,
        capacity: siakadClasses.capacity,
        enrolledCount: siakadClasses.enrolledCount,
        mode: siakadClasses.mode,
        status: siakadClasses.status,
      })
      .from(siakadClasses)
      .innerJoin(siakadCourses, eq(siakadClasses.courseId, siakadCourses.id))
      .where(
        and(
          eq(siakadClasses.dosenUtamaId, lecturer.id),
          eq(siakadClasses.academicPeriodId, activePeriod.id)
        )
      );

    // Get schedules for each class
    const classesWithSchedules = await Promise.all(
      classes.map(async (cls) => {
        const schedules = await db
          .select({
            sessionNumber: siakadClassSchedules.sessionNumber,
            topic: siakadClassSchedules.topic,
            sessionDate: siakadClassSchedules.sessionDate,
            startTime: siakadClassSchedules.startTime,
            endTime: siakadClassSchedules.endTime,
            sessionType: siakadClassSchedules.sessionType,
          })
          .from(siakadClassSchedules)
          .where(eq(siakadClassSchedules.classId, cls.classId));

        return { ...cls, schedules };
      })
    );

    return NextResponse.json({
      success: true,
      lecturer: { ...lecturer, studyProgramName },
      classes: classesWithSchedules,
      period: activePeriod,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
