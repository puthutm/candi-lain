import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { siakadStudents } from "@/db/schema/civitas";
import { siakadStudyPrograms, siakadCourses } from "@/db/schema/master";
import { siakadGrades } from "@/db/schema/krs";
import { siakadClasses } from "@/db/schema/classes";
import { eq, or } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. Fetch student by ID or NIM
    const students = await db
      .select({
        id: siakadStudents.id,
        nim: siakadStudents.nim,
        fullName: siakadStudents.fullName,
        angkatan: siakadStudents.angkatan,
        currentSemester: siakadStudents.currentSemester,
        academicStatus: siakadStudents.academicStatus,
        ipk: siakadStudents.ipk,
        totalSksLulus: siakadStudents.totalSksLulus,
        prodiName: siakadStudyPrograms.name,
        prodiCode: siakadStudyPrograms.degreeLevel,
      })
      .from(siakadStudents)
      .leftJoin(siakadStudyPrograms, eq(siakadStudents.studyProgramId, siakadStudyPrograms.id))
      .where(or(eq(siakadStudents.id, id), eq(siakadStudents.nim, id)));

    if (students.length === 0) {
      return NextResponse.json(
        { success: false, error: "Dokumen transkrip atau data mahasiswa tidak ditemukan" },
        { status: 404 }
      );
    }

    const student = students[0]!;

    // 2. Fetch grades for this student
    const grades = await db
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
      .where(eq(siakadGrades.studentId, student.id));

    return NextResponse.json({
      success: true,
      verified: true,
      verifiedAt: new Date().toISOString(),
      institution: "Universitas Siber Asia (UNSIA)",
      student,
      grades,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
