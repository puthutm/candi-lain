import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { siakadLecturers, siakadStudents } from "@/db/schema/civitas";
import { siakadGrades, siakadKrsItems, siakadKrs } from "@/db/schema/krs";
import { siakadCourses, siakadAcademicPeriods } from "@/db/schema/master";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("siakad_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json({ success: false, error: "classId required" }, { status: 400 });
    }

    // Find lecturer
    const [lecturer] = await db
      .select({ id: siakadLecturers.id })
      .from(siakadLecturers)
      .where(eq(siakadLecturers.userId, sessionUser.userId))
      .limit(1);

    if (!lecturer) {
      return NextResponse.json({ success: false, error: "Bukan dosen" }, { status: 403 });
    }

    // Get grades for this class
    const grades = await db
      .select({
        gradeId: siakadGrades.id,
        studentId: siakadGrades.studentId,
        nim: siakadStudents.nim,
        fullName: siakadStudents.fullName,
        tugasScore: siakadGrades.tugasScore,
        utsScore: siakadGrades.utsScore,
        uasScore: siakadGrades.uasScore,
        finalScore: siakadGrades.finalScore,
        letterGrade: siakadGrades.letterGrade,
        locked: siakadGrades.locked,
      })
      .from(siakadGrades)
      .innerJoin(siakadStudents, eq(siakadGrades.studentId, siakadStudents.id))
      .where(eq(siakadGrades.classId, classId));

    // If no grades yet, get enrolled students from KRS items
    if (grades.length === 0) {
      const [activePeriod] = await db
        .select()
        .from(siakadAcademicPeriods)
        .where(eq(siakadAcademicPeriods.status, "berjalan"))
        .limit(1);

      if (activePeriod) {
        const enrolledStudents = await db
          .select({
            studentId: siakadStudents.id,
            nim: siakadStudents.nim,
            fullName: siakadStudents.fullName,
          })
          .from(siakadKrsItems)
          .innerJoin(siakadKrs, eq(siakadKrsItems.krsId, siakadKrs.id))
          .innerJoin(siakadStudents, eq(siakadKrs.studentId, siakadStudents.id))
          .where(
            and(
              eq(siakadKrsItems.classId, classId),
              eq(siakadKrsItems.status, "disetujui")
            )
          );

        return NextResponse.json({
          success: true,
          grades: enrolledStudents.map((s) => ({
            gradeId: null,
            studentId: s.studentId,
            nim: s.nim,
            fullName: s.fullName,
            tugasScore: "0.00",
            utsScore: "0.00",
            uasScore: "0.00",
            finalScore: "0.00",
            letterGrade: null,
            locked: false,
          })),
        });
      }
    }

    return NextResponse.json({ success: true, grades });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Save grades
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("siakad_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);
    const body = await req.json();
    const { classId, grades: gradeUpdates } = body;

    if (!classId || !gradeUpdates || !Array.isArray(gradeUpdates)) {
      return NextResponse.json({ success: false, error: "classId and grades[] required" }, { status: 400 });
    }

    // Find lecturer
    const [lecturer] = await db
      .select({ id: siakadLecturers.id })
      .from(siakadLecturers)
      .where(eq(siakadLecturers.userId, sessionUser.userId))
      .limit(1);

    if (!lecturer) {
      return NextResponse.json({ success: false, error: "Bukan dosen" }, { status: 403 });
    }

    let savedCount = 0;
    for (const g of gradeUpdates) {
      const { studentId, tugasScore, utsScore, uasScore, finalScore, letterGrade } = g;
      if (!studentId) continue;

      // Upsert
      const [existing] = await db
        .select({ id: siakadGrades.id })
        .from(siakadGrades)
        .where(
          and(
            eq(siakadGrades.studentId, studentId),
            eq(siakadGrades.classId, classId)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(siakadGrades)
          .set({
            tugasScore: (tugasScore || 0).toString(),
            utsScore: (utsScore || 0).toString(),
            uasScore: (uasScore || 0).toString(),
            finalScore: (finalScore || 0).toString(),
            letterGrade: letterGrade || null,
            gradedByLecturerId: lecturer.id,
          })
          .where(eq(siakadGrades.id, existing.id));
      } else {
        await db.insert(siakadGrades).values({
          studentId,
          classId,
          tugasScore: (tugasScore || 0).toString(),
          utsScore: (utsScore || 0).toString(),
          uasScore: (uasScore || 0).toString(),
          finalScore: (finalScore || 0).toString(),
          letterGrade: letterGrade || null,
          gradedByLecturerId: lecturer.id,
        });
      }
      savedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `${savedCount} nilai berhasil disimpan`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
