import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants } from "@/db/schema/pmb";
import { siakadStudents, siakadLecturers } from "@/db/schema/civitas";
import { siakadStudyPrograms, siakadCurricula } from "@/db/schema/master";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      pmb_applicant_id,
      registrationNumber,
      fullName,
      email,
      phone,
      birthPlace,
      birthDate,
      gender,
      address,
      studyProgramCode,
      entryPath,
    } = body;

    if (!pmb_applicant_id || !registrationNumber || !fullName || !email) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // 1. Ensure PMB applicant record exists in SIAKAD (idempotency check part 1)
      let applicant = await tx
        .select()
        .from(pmbApplicants)
        .where(eq(pmbApplicants.id, pmb_applicant_id))
        .limit(1);

      if (applicant.length === 0) {
        const inserted = await tx
          .insert(pmbApplicants)
          .values({
            id: pmb_applicant_id,
            registrationNumber,
            fullName,
            email,
          })
          .returning();
        applicant = inserted;
      }

      // 2. Check if student already exists (idempotency check part 2)
      const existingStudent = await tx
        .select()
        .from(siakadStudents)
        .where(eq(siakadStudents.applicantId, pmb_applicant_id))
        .limit(1);

      if (existingStudent.length > 0) {
        return { student: existingStudent[0], isNew: false };
      }

      // 3. Map study program code to SIAKAD study program name
      let siakadProdiName = "S1 Informatika";
      if (studyProgramCode === "SI") {
        siakadProdiName = "S1 Sistem Informasi";
      } else if (studyProgramCode === "MAN") {
        siakadProdiName = "S1 Manajemen";
      } else if (studyProgramCode === "AKT") {
        siakadProdiName = "S1 Akuntansi";
      }

      const prodis = await tx
        .select()
        .from(siakadStudyPrograms)
        .where(eq(siakadStudyPrograms.name, siakadProdiName))
        .limit(1);

      if (prodis.length === 0) {
        throw new Error(`Program studi ${siakadProdiName} tidak ditemukan di database SIAKAD`);
      }
      const studyProgramId = prodis[0]!.id;

      // 4. Find PA lecturer & Curriculum for study program
      const lecturers = await tx
        .select()
        .from(siakadLecturers)
        .where(eq(siakadLecturers.studyProgramId, studyProgramId))
        .limit(1);
      const dosenPaId = lecturers[0]?.id || null;

      const curricula = await tx
        .select()
        .from(siakadCurricula)
        .where(eq(siakadCurricula.studyProgramId, studyProgramId))
        .limit(1);
      const curriculumId = curricula[0]?.id || null;

      // 5. Create student record (with NIM set to null initially)
      const [newStudent] = await tx
        .insert(siakadStudents)
        .values({
          applicantId: pmb_applicant_id,
          fullName,
          personalEmail: email,
          phone: phone || "08123456789",
          birthPlace: birthPlace || "Jakarta",
          birthDate: birthDate || "2007-01-01",
          gender: (gender === "L" || gender === "P") ? gender : "L",
          religion: "Islam",
          address: address || "Jl. Raya",
          studyProgramId,
          angkatan: 2026,
          currentSemester: 1,
          academicStatus: "aktif",
          dosenPaId,
          curriculumId,
          entryPath: entryPath === "beasiswa" ? "beasiswa" : "mandiri",
          nim: null, // Issued after onboarding payment (UKT)
          ipk: "0.00",
          totalSksLulus: 0,
        })
        .returning();

      return { student: newStudent, isNew: true };
    });

    return NextResponse.json({
      success: true,
      message: result.isNew
        ? "Calon mahasiswa berhasil terintegrasi ke SIAKAD!"
        : "Calon mahasiswa sudah terintegrasi sebelumnya.",
      student: result.student,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
