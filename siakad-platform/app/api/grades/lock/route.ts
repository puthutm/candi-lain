import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadClasses } from "@/db/schema/classes";
import { siakadGrades } from "@/db/schema/krs";
import { siakadStudents } from "@/db/schema/civitas";
import { siakadCourses } from "@/db/schema/master";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { classId } = body;

    if (!classId) {
      return NextResponse.json({ success: false, error: "Missing classId" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // 1. Get and verify class
      const classList = await tx
        .select()
        .from(siakadClasses)
        .where(eq(siakadClasses.id, classId))
        .limit(1);

      if (classList.length === 0) {
        throw new Error("Kelas tidak ditemukan");
      }

      // 2. Lock class grading
      await tx
        .update(siakadClasses)
        .set({ gradeLocked: true })
        .where(eq(siakadClasses.id, classId));

      // 3. Lock all student grade entries in this class
      await tx
        .update(siakadGrades)
        .set({ locked: true })
        .where(eq(siakadGrades.classId, classId));

      // 4. Retrieve list of students enrolled in this class
      const studentGrades = await tx
        .select({ studentId: siakadGrades.studentId })
        .from(siakadGrades)
        .where(eq(siakadGrades.classId, classId));

      const uniqueStudentIds = Array.from(new Set(studentGrades.map((sg) => sg.studentId)));

      // 5. Recalculate GPA/IPK for each unique student
      const updatedStudents = [];
      for (const studentId of uniqueStudentIds) {
        // Fetch all locked grades for this student
        const allGrades = await tx
          .select({
            gradePoint: siakadGrades.gradePoint,
            courseId: siakadClasses.courseId,
            sks: siakadCourses.sks,
          })
          .from(siakadGrades)
          .innerJoin(siakadClasses, eq(siakadGrades.classId, siakadClasses.id))
          .innerJoin(siakadCourses, eq(siakadClasses.courseId, siakadCourses.id))
          .where(
            and(
              eq(siakadGrades.studentId, studentId),
              eq(siakadGrades.locked, true)
            )
          );

        // Resolve best score for repeated courses
        const bestGrades: Record<string, { gradePoint: number; sks: number }> = {};
        allGrades.forEach((g: any) => {
          const gp = parseFloat(g.gradePoint || "0");
          const sks = g.sks || 0;
          const existing = bestGrades[g.courseId];
          if (!existing || gp > existing.gradePoint) {
            bestGrades[g.courseId] = { gradePoint: gp, sks };
          }
        });

        let totalMutu = 0;
        let totalSksKumulatif = 0;
        let totalSksLulus = 0;

        Object.values(bestGrades).forEach((bg) => {
          totalMutu += bg.gradePoint * bg.sks;
          totalSksKumulatif += bg.sks;
          if (bg.gradePoint > 0) {
            totalSksLulus += bg.sks;
          }
        });

        const ipk = totalSksKumulatif > 0
          ? (totalMutu / totalSksKumulatif).toFixed(2)
          : "0.00";

        // Update student record
        await tx
          .update(siakadStudents)
          .set({
            ipk: ipk,
            totalSksLulus: totalSksLulus,
          })
          .where(eq(siakadStudents.id, studentId));

        updatedStudents.push({ studentId, ipk, totalSksLulus });
      }

      return { classId, updatedStudents };
    });

    return NextResponse.json({
      success: true,
      message: `Nilai kelas berhasil dikunci. Kalkulasi IPK berhasil dijalankan untuk ${result.updatedStudents.length} mahasiswa.`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
