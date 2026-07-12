import { NextResponse } from "next/server";
import { db } from "@/db";
import { lmsClasses, classEnrollments } from "@/db/schema/classes";
import { eq, and } from "drizzle-orm";

// Import SIAKAD tables through package alias to avoid fragile relative paths
import { siakadAcademicPeriods, siakadCourses } from "@/../siakad-platform/db/schema/master";
import { siakadClasses } from "@/../siakad-platform/db/schema/classes";
import { siakadKrs, siakadKrsItems } from "@/../siakad-platform/db/schema/krs";

export async function POST() {
  try {
    const result = await db.transaction(async (tx) => {
      // 1. Fetch active period from SIAKAD
      const periods = await tx
        .select()
        .from(siakadAcademicPeriods);

      const activePeriod = periods.find((p) => p.status === "berjalan") || periods[0]!;

      if (!activePeriod) {
        throw new Error("Active academic period not found in SIAKAD");
      }

      // 2. Fetch classes of active period from SIAKAD
      const classesList = await tx
        .select({
          classId: siakadClasses.id,
          className: siakadClasses.className,
          dosenUtamaId: siakadClasses.dosenUtamaId,
          courseId: siakadClasses.courseId,
          courseCode: siakadCourses.code,
          courseName: siakadCourses.name,
          sks: siakadCourses.sks,
        })
        .from(siakadClasses)
        .innerJoin(siakadCourses, eq(siakadClasses.courseId, siakadCourses.id))
        .where(eq(siakadClasses.academicPeriodId, activePeriod.id));

      const syncedClasses = [];

      // 3. Upsert into lmsClasses
      for (const cls of classesList) {
        // Check if class already exists in LMS
        const existingLmsClass = await tx
          .select()
          .from(lmsClasses)
          .where(eq(lmsClasses.siakadClassId, cls.classId))
          .limit(1);

        let lmsClassId;
        if (existingLmsClass.length > 0) {
          lmsClassId = existingLmsClass[0]!.id;
          await tx
            .update(lmsClasses)
            .set({
              courseCode: cls.courseCode,
              courseName: cls.courseName,
              sks: cls.sks,
              scheduleText: `Sesi ${cls.className}`,
              academicPeriodLabel: activePeriod.name,
              dosenUserId: cls.dosenUtamaId || "00000000-0000-0000-0000-000000000000",
              lastSyncedAt: new Date(),
            })
            .where(eq(lmsClasses.id, lmsClassId));
        } else {
          const [inserted] = await tx
            .insert(lmsClasses)
            .values({
              classType: "akademik",
              siakadClassId: cls.classId,
              courseCode: cls.courseCode,
              courseName: cls.courseName,
              sks: cls.sks,
              academicPeriodLabel: activePeriod.name,
              scheduleText: `Sesi ${cls.className}`,
              learningMode: "async",
              dosenUserId: cls.dosenUtamaId || "00000000-0000-0000-0000-000000000000",
              lastSyncedAt: new Date(),
            })
            .returning();
          lmsClassId = inserted!.id;
        }

        syncedClasses.push({ siakadClassId: cls.classId, lmsClassId });
      }

      // 4. Fetch approved KRS items for this active period
      const krsItemsList = await tx
        .select({
          krsItemId: siakadKrsItems.id,
          classId: siakadKrsItems.classId,
          studentId: siakadKrs.studentId,
        })
        .from(siakadKrsItems)
        .innerJoin(siakadKrs, eq(siakadKrsItems.krsId, siakadKrs.id))
        .where(
          and(
            eq(siakadKrs.academicPeriodId, activePeriod.id),
            eq(siakadKrs.status, "disetujui_pa")
          )
        );

      let enrollmentCount = 0;
      for (const item of krsItemsList) {
        // Find corresponding LMS class
        const targetLmsClass = syncedClasses.find((sc) => sc.siakadClassId === item.classId);
        if (!targetLmsClass) continue;

        // Idempotent enrollments check
        const existingEnrollment = await tx
          .select()
          .from(classEnrollments)
          .where(
            and(
              eq(classEnrollments.classId, targetLmsClass.lmsClassId),
              eq(classEnrollments.userId, item.studentId)
            )
          )
          .limit(1);

        if (existingEnrollment.length === 0) {
          await tx.insert(classEnrollments).values({
            classId: targetLmsClass.lmsClassId,
            userId: item.studentId,
            role: "mahasiswa",
            krsItemRef: item.krsItemId,
          });
          enrollmentCount++;
        }
      }

      return { classesCount: syncedClasses.length, enrollmentCount };
    });

    return NextResponse.json({
      success: true,
      message: "Sinkronisasi SIAKAD berhasil dijalankan!",
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
