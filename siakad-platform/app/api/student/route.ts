import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadStudents, siakadLecturers } from "@/db/schema/civitas";
import { siakadStudyPrograms, siakadCurricula, siakadCourses, siakadCurriculumCourses, siakadAcademicPeriods } from "@/db/schema/master";
import { siakadKrs, siakadKrsItems } from "@/db/schema/krs";
import { siakadClasses } from "@/db/schema/classes";
import { eq, and, sql, isNotNull } from "drizzle-orm";

export async function GET(_req: Request) {
  try {
    // Return Budi Santoso profile if exists, otherwise return onboarding template
    const studentList = await db
      .select()
      .from(siakadStudents)
      .where(eq(siakadStudents.fullName, "Budi Santoso"))
      .limit(1);

    if (studentList.length > 0) {
      return NextResponse.json({
        success: true,
        student: studentList[0]!,
        onboarded: true,
      });
    }

    return NextResponse.json({
      success: true,
      onboarded: false,
      message: "Student profile not created yet. Please complete onboarding.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Complete Onboarding & Issue NIM
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, phone } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email wajib diisi" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // 1. Find existing student from PMB callback or previous draft
      let studentList = await tx
        .select()
        .from(siakadStudents)
        .where(eq(siakadStudents.personalEmail, email))
        .limit(1);

      let student: typeof siakadStudents.$inferSelect;
      if (studentList.length > 0) {
        student = studentList[0]!;
        // If already onboarded (has NIM), just return it
        if (student.nim) {
          return { student, isNewOnboarding: false };
        }
      } else {
        // Fallback: create student if not already present from callback
        const prodis = await tx.select().from(siakadStudyPrograms).limit(1);
        const studyProgramId = prodis[0]?.id;

        if (!studyProgramId) {
          throw new Error("Master Program Studi belum ter-seed. Jalankan /api/seed terlebih dahulu.");
        }

        const lecturers = await tx.select().from(siakadLecturers).limit(1);
        const dosenPaId = lecturers[0]?.id || null;

        const curricula = await tx.select().from(siakadCurricula).limit(1);
        const curriculumId = curricula[0]?.id || null;

        const [createdStudent] = await tx
          .insert(siakadStudents)
          .values({
            fullName: fullName || "Budi Santoso",
            personalEmail: email,
            phone: phone || "08123456789",
            birthPlace: "Jakarta",
            birthDate: "2005-09-12",
            gender: "L",
            religion: "Islam",
            address: "Jl. Siber Raya No. 4, Jakarta",
            studyProgramId,
            angkatan: 2026,
            currentSemester: 1,
            academicStatus: "aktif",
            dosenPaId,
            curriculumId,
            ipk: "0.00",
            totalSksLulus: 0,
          })
          .returning();

        if (!createdStudent) {
          throw new Error("Gagal membuat data mahasiswa baru");
        }
        student = createdStudent;
      }

      // 2. Generate sequential NIM: format [Tahun(2), KodeProdi(3), Urutan(4)]
      const years = 2026;
      const tahunPart = String(years).slice(-2);

      const prodi = await tx
        .select()
        .from(siakadStudyPrograms)
        .where(eq(siakadStudyPrograms.id, student.studyProgramId))
        .limit(1);

      let prodiCode = "INF";
      if (prodi.length > 0) {
        if (prodi[0]!.name.includes("Sistem Informasi")) {
          prodiCode = "SI";
        } else if (prodi[0]!.name.includes("Manajemen")) {
          prodiCode = "MAN";
        } else if (prodi[0]!.name.includes("Akuntansi")) {
          prodiCode = "AKT";
        }
      }

      const countResult = await tx
        .select({ count: sql<number>`count(${siakadStudents.id})::int` })
        .from(siakadStudents)
        .where(
          and(
            eq(siakadStudents.studyProgramId, student.studyProgramId),
            eq(siakadStudents.angkatan, years),
            isNotNull(siakadStudents.nim)
          )
        );

      let urutan = (countResult[0]?.count || 0) + 1;
      let nim = "";
      let isDuplicate = true;
      let retryCount = 0;

      while (isDuplicate && retryCount < 3) {
        nim = `${tahunPart}${prodiCode}${String(urutan).padStart(4, "0")}`;
        const duplicateCheck = await tx
          .select()
          .from(siakadStudents)
          .where(eq(siakadStudents.nim, nim))
          .limit(1);

        if (duplicateCheck.length === 0) {
          isDuplicate = false;
        } else {
          urutan++;
          retryCount++;
        }
      }

      if (isDuplicate) {
        throw new Error("Gagal membuat NIM unik untuk mahasiswa.");
      }

      // 3. Update student record with NIM and activate onboarding
      const [updatedStudent] = await tx
        .update(siakadStudents)
        .set({ nim, academicStatus: "aktif" })
        .where(eq(siakadStudents.id, student.id))
        .returning();

      if (!updatedStudent) {
        throw new Error("Gagal mengupdate NIM mahasiswa.");
      }

      // 4. Automatically generate initial KRS (KRS Perdana)
      const periods = await tx.select().from(siakadAcademicPeriods);
      const activePeriod = periods.find((p) => p.status === "berjalan") || periods[0]!;

      if (activePeriod && updatedStudent.curriculumId) {
        const semester1Courses = await tx
          .select({
            id: siakadCourses.id,
            sks: siakadCourses.sks,
          })
          .from(siakadCurriculumCourses)
          .innerJoin(siakadCourses, eq(siakadCurriculumCourses.courseId, siakadCourses.id))
          .where(
            and(
              eq(siakadCurriculumCourses.curriculumId, updatedStudent.curriculumId),
              eq(siakadCurriculumCourses.semesterOffered, 1)
            )
          );

        if (semester1Courses.length > 0) {
          // Create KRS draft
          const [newKrs] = await tx
            .insert(siakadKrs)
            .values({
              studentId: updatedStudent.id,
              academicPeriodId: activePeriod.id,
              status: "diajukan",
              totalSks: 0,
              maxSksAllowed: 24,
            })
            .returning();

          if (newKrs) {
            let totalSks = 0;
            for (const course of semester1Courses) {
              // Find or create default class session
              let targetClassList = await tx
                .select()
                .from(siakadClasses)
                .where(
                  and(
                    eq(siakadClasses.courseId, course.id),
                    eq(siakadClasses.academicPeriodId, activePeriod.id),
                    eq(siakadClasses.studyProgramId, updatedStudent.studyProgramId)
                  )
                )
                .limit(1);

              let classId;
              if (targetClassList.length > 0) {
                classId = targetClassList[0]!.id;
              } else {
                const [newClass] = await tx
                  .insert(siakadClasses)
                  .values({
                    courseId: course.id,
                    academicPeriodId: activePeriod.id,
                    studyProgramId: updatedStudent.studyProgramId,
                    className: "Kelas A",
                    capacity: 80,
                    enrolledCount: 0,
                    status: "aktif",
                  })
                  .returning();
                if (!newClass) {
                  throw new Error("Gagal membuat kelas otomatis");
                }
                classId = newClass.id;
              }

              // Insert KRS item
              await tx.insert(siakadKrsItems).values({
                krsId: newKrs.id,
                classId,
                status: "diajukan",
              });

              totalSks += course.sks;
            }

            // Update KRS total SKS
            await tx
              .update(siakadKrs)
              .set({ totalSks })
              .where(eq(siakadKrs.id, newKrs.id));
          }
        }
      }

      return { student: updatedStudent, isNewOnboarding: true };
    });

    return NextResponse.json({
      success: true,
      message: result.isNewOnboarding
        ? `Proses onboarding berhasil! NIM ${result.student.nim} telah terbit.`
        : "Mahasiswa sudah onboarded sebelumnya.",
      student: result.student,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
