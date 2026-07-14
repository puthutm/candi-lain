import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { siakadStudents, siakadLecturers } from "@/db/schema/civitas";
import { siakadStudyPrograms } from "@/db/schema/master";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("siakad_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);

    // Find student by SSO userId
    const studentRows = await db
      .select({
        id: siakadStudents.id,
        nim: siakadStudents.nim,
        fullName: siakadStudents.fullName,
        studyProgramId: siakadStudents.studyProgramId,
        angkatan: siakadStudents.angkatan,
        currentSemester: siakadStudents.currentSemester,
        academicStatus: siakadStudents.academicStatus,
        ipk: siakadStudents.ipk,
        totalSksLulus: siakadStudents.totalSksLulus,
        entryPath: siakadStudents.entryPath,
        campusEmail: siakadStudents.campusEmail,
        personalEmail: siakadStudents.personalEmail,
        phone: siakadStudents.phone,
        dosenPaId: siakadStudents.dosenPaId,
      })
      .from(siakadStudents)
      .where(eq(siakadStudents.userId, sessionUser.userId))
      .limit(1);

    const student = studentRows[0];
    if (!student) {
      return NextResponse.json({ success: true, student: null });
    }

    // Get study program name
    let studyProgramName = "";
    if (student.studyProgramId) {
      const [sp] = await db
        .select({ name: siakadStudyPrograms.name })
        .from(siakadStudyPrograms)
        .where(eq(siakadStudyPrograms.id, student.studyProgramId))
        .limit(1);
      studyProgramName = sp?.name || "";
    }

    // Get PA advisor name
    let dosenPaName = "";
    if (student.dosenPaId) {
      const [pa] = await db
        .select({ fullName: siakadLecturers.fullName })
        .from(siakadLecturers)
        .where(eq(siakadLecturers.id, student.dosenPaId))
        .limit(1);
      dosenPaName = pa?.fullName || "";
    }

    return NextResponse.json({
      success: true,
      student: {
        ...student,
        studyProgramName,
        dosenPaName,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
