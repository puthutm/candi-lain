import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lmsClasses, classEnrollments } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const eventName = req.headers.get("X-Event-Name");
    const body = await req.json();

    if (eventName === "krs.approved") {
      const { krsItemId, classId, studentUserId, courseCode, courseName, sks, academicPeriodLabel } = body;

      if (!classId || !studentUserId) {
        return NextResponse.json(
          { success: false, error: "classId dan studentUserId wajib diisi" },
          { status: 400 }
        );
      }

      console.log(`[LMS SIAKAD Consumer] Processing krs.approved for user ${studentUserId} in class ${classId}...`);

      // 1. Ensure LMS Class exists
      let [lmsClass] = await db
        .select()
        .from(lmsClasses)
        .where(eq(lmsClasses.siakadClassId, classId));

      if (!lmsClass) {
        const [newClass] = await db
          .insert(lmsClasses)
          .values({
            siakadClassId: classId,
            courseCode: courseCode || "MKU101",
            courseName: courseName || "Kelas Matakuliah SIAKAD",
            sks: sks || 3,
            academicPeriodLabel: academicPeriodLabel || "2026/2027 Ganjil",
            dosenUserId: "00000000-0000-0000-0000-000000000001", // Placeholder Dosen
            lastSyncedAt: new Date(),
          })
          .returning();

        lmsClass = newClass;
      }

      // 2. Idempotent Enrollment
      const existingEnrollments = await db
        .select()
        .from(classEnrollments)
        .where(
          and(
            eq(classEnrollments.classId, lmsClass!.id),
            eq(classEnrollments.userId, studentUserId)
          )
        );

      if (existingEnrollments.length === 0) {
        await db.insert(classEnrollments).values({
          classId: lmsClass!.id,
          userId: studentUserId,
          role: "mahasiswa",
          krsItemRef: krsItemId || null,
        });

        console.log(`[LMS SIAKAD Consumer] Student ${studentUserId} successfully enrolled in LMS class ${lmsClass!.id}`);
      }

      return NextResponse.json({
        success: true,
        message: "Auto-enrolment krs.approved berhasil diproses!",
      });
    }

    if (eventName === "class.dosen_changed") {
      const { classId, newDosenUserId } = body;
      if (classId && newDosenUserId) {
        await db
          .update(lmsClasses)
          .set({ dosenUserId: newDosenUserId, updatedAt: new Date() })
          .where(eq(lmsClasses.siakadClassId, classId));
      }
      return NextResponse.json({ success: true, message: "Dosen pengampu berhasil diperbarui!" });
    }

    return NextResponse.json(
      { success: false, error: `Event '${eventName}' tidak dikenal` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[LMS SIAKAD Consumer Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses webhook SIAKAD" },
      { status: 500 }
    );
  }
}
