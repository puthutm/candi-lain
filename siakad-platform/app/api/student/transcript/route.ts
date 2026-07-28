import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siakadStudents, siakadGrades, siakadClasses, siakadCourses, siakadStudyPrograms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateGpa } from "@/lib/grade-calculator";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "studentId query parameter wajib diisi" },
        { status: 400 }
      );
    }

    const [student] = await db
      .select({
        id: siakadStudents.id,
        fullName: siakadStudents.fullName,
        nim: siakadStudents.nim,
        personalEmail: siakadStudents.personalEmail,
        academicStatus: siakadStudents.academicStatus,
        prodiName: siakadStudyPrograms.name,
      })
      .from(siakadStudents)
      .leftJoin(siakadStudyPrograms, eq(siakadStudents.studyProgramId, siakadStudyPrograms.id))
      .where(eq(siakadStudents.id, studentId));

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Mahasiswa tidak ditemukan" },
        { status: 404 }
      );
    }

    // Fetch grades
    const gradesList = await db
      .select({
        id: siakadGrades.id,
        courseCode: siakadCourses.code,
        courseName: siakadCourses.name,
        sks: siakadCourses.sks,
        finalScore: siakadGrades.finalScore,
        letterGrade: siakadGrades.letterGrade,
        gradePoint: siakadGrades.gradePoint,
      })
      .from(siakadGrades)
      .innerJoin(siakadClasses, eq(siakadGrades.classId, siakadClasses.id))
      .innerJoin(siakadCourses, eq(siakadClasses.courseId, siakadCourses.id))
      .where(eq(siakadGrades.studentId, studentId));

    const gpaResult = calculateGpa(
      gradesList.map((g) => ({
        sks: g.sks,
        gradePoint: parseFloat(g.gradePoint || "0"),
      }))
    );

    return NextResponse.json({
      success: true,
      student,
      summary: {
        ipk: gpaResult.gpa,
        totalSksLulus: gpaResult.totalSks,
        totalBobotMutu: gpaResult.totalMutu,
      },
      grades: gradesList,
    });
  } catch (error: any) {
    console.error("[Student Transcript Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat transkrip nilai" },
      { status: 500 }
    );
  }
}
