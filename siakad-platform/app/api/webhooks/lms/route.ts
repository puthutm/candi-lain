import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siakadGrades, siakadStudents } from "@/db/schema";
import { convertScoreToGrade } from "@/lib/grade-calculator";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const eventName = req.headers.get("X-Event-Name");
    const body = await req.json();

    if (eventName === "grade.finalized") {
      const { siakadClassId, studentUserId, finalScore, letterGrade, tugasScore, utsScore, uasScore } = body;

      if (!studentUserId || finalScore === undefined) {
        return NextResponse.json(
          { success: false, error: "studentUserId dan finalScore wajib diisi" },
          { status: 400 }
        );
      }

      console.log(`[SIAKAD LMS Consumer] Processing grade.finalized for user ${studentUserId} (Score: ${finalScore})...`);

      // Match student by ID or email
      const studentsList = await db
        .select()
        .from(siakadStudents)
        .where(eq(siakadStudents.id, studentUserId));

      const studentId = studentsList[0]?.id || studentUserId;

      const scoreNum = parseFloat(finalScore);
      const conversion = convertScoreToGrade(scoreNum);

      // Check existing grade
      const existingGrades = await db
        .select()
        .from(siakadGrades)
        .where(
          and(
            eq(siakadGrades.studentId, studentId),
            eq(siakadGrades.classId, siakadClassId || "00000000-0000-0000-0000-000000000001")
          )
        );

      if (existingGrades.length > 0) {
        await db
          .update(siakadGrades)
          .set({
            tugasScore: String(tugasScore || 0),
            utsScore: String(utsScore || 0),
            uasScore: String(uasScore || 0),
            finalScore: String(scoreNum),
            letterGrade: letterGrade || conversion.letterGrade,
            gradePoint: String(conversion.gradePoint),
            locked: true,
          })
          .where(eq(siakadGrades.id, existingGrades[0]!.id));
      } else {
        await db.insert(siakadGrades).values({
          studentId,
          classId: siakadClassId || "00000000-0000-0000-0000-000000000001",
          tugasScore: String(tugasScore || 0),
          utsScore: String(utsScore || 0),
          uasScore: String(uasScore || 0),
          finalScore: String(scoreNum),
          letterGrade: letterGrade || conversion.letterGrade,
          gradePoint: String(conversion.gradePoint),
          locked: true,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Nilai dari LMS ICEMS berhasil disinkronkan ke KHS SIAKAD!",
      });
    }

    return NextResponse.json(
      { success: false, error: `Event '${eventName}' tidak dikenal` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[SIAKAD LMS Consumer Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses webhook LMS" },
      { status: 500 }
    );
  }
}
