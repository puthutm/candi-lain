import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadGrades } from "@/db/schema/krs";
import { siakadStudents } from "@/db/schema/civitas";
import { eq, and } from "drizzle-orm";

function getGradePoint(letter: string): string {
  switch (letter) {
    case "A": return "4.00";
    case "B": return "3.00";
    case "C": return "2.00";
    case "D": return "1.00";
    default: return "0.00";
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { event, data } = payload;

    if (event !== "grade.finalized" || !data) {
      return NextResponse.json({ success: false, error: "Invalid event type" }, { status: 400 });
    }

    const { siakad_class_id, student_user_id, final_score, letter_grade } = data;

    // 1. Resolve student UUID if passed as student NIM or user ID
    let studentId = student_user_id;
    const studentsList = await db
      .select()
      .from(siakadStudents)
      .where(eq(siakadStudents.nim, student_user_id))
      .limit(1);

    if (studentsList.length > 0) {
      studentId = studentsList[0]!.id;
    }

    // 2. Fetch existing grade record
    const existing = await db
      .select()
      .from(siakadGrades)
      .where(
        and(
          eq(siakadGrades.classId, siakad_class_id),
          eq(siakadGrades.studentId, studentId)
        )
      )
      .limit(1);

    const gradePoint = getGradePoint(letter_grade);

    let finalRecord;

    if (existing.length > 0) {
      // Update
      const [updated] = await db
        .update(siakadGrades)
        .set({
          finalScore: Number(final_score).toFixed(2),
          letterGrade: letter_grade,
          gradePoint,
          locked: true,
        })
        .where(eq(siakadGrades.id, existing[0]!.id))
        .returning();
      finalRecord = updated;
    } else {
      // Insert
      const [inserted] = await db
        .insert(siakadGrades)
        .values({
          studentId,
          classId: siakad_class_id,
          finalScore: Number(final_score).toFixed(2),
          letterGrade: letter_grade,
          gradePoint,
          locked: true,
        })
        .returning();
      finalRecord = inserted;
    }

    return NextResponse.json({
      success: true,
      message: "Student grade finalized successfully from LMS webhook!",
      grade: finalRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
