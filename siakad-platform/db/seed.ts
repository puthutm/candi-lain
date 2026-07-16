import { db } from "@/db";
import { siakadStudyPrograms, siakadCurricula, siakadAcademicPeriods, siakadCourses, siakadCurriculumCourses } from "@/db/schema/master";
import { siakadLecturers, siakadStudents } from "@/db/schema/civitas";
import { ssoUsers } from "@/db/schema/sso";
import { siakadClasses, siakadClassSchedules } from "@/db/schema/classes";
import { eq } from "drizzle-orm";

export async function ensureSiakadSeeded() {
  try {
    // 1. Seed Study Programs
    const prodisCount = await db.select().from(siakadStudyPrograms);
    let infId = "";
    if (prodisCount.length === 0) {
      const insertedProdis = await db.insert(siakadStudyPrograms).values([
        { name: "S1 Informatika", faculty: "FTI", degreeLevel: "S1" },
        { name: "S1 Sistem Informasi", faculty: "FTI", degreeLevel: "S1" }
      ]).returning();
      infId = insertedProdis[0]?.id || "";
    } else {
      infId = prodisCount.find(p => p.name.includes("Informatika"))?.id || "";
    }

    // Resolve SSO user for dosen and mahasiswa
    const ssoDosen = await db.select().from(ssoUsers).where(eq(ssoUsers.username, "dosen")).limit(1);
    const dosenUserId = ssoDosen[0]?.id || null;

    const ssoMhs = await db.select().from(ssoUsers).where(eq(ssoUsers.username, "mahasiswa")).limit(1);
    const mhsUserId = ssoMhs[0]?.id || null;

    // 2. Seed Lecturers
    const lecturersCount = await db.select().from(siakadLecturers);
    let lecturerId = "";
    if (lecturersCount.length === 0 && infId) {
      const [insertedLecturer] = await db.insert(siakadLecturers).values([
        { 
          nidn: "0421098501", 
          fullName: "Dr. Hendra Setiawan, M.Kom.", 
          studyProgramId: infId, 
          position: "Lektor Kepala",
          userId: dosenUserId
        }
      ]).returning();
      lecturerId = insertedLecturer?.id || "";
    } else {
      lecturerId = lecturersCount[0]?.id || "";
      if (lecturerId && lecturersCount[0]?.userId !== dosenUserId && dosenUserId) {
        await db.update(siakadLecturers).set({ userId: dosenUserId }).where(eq(siakadLecturers.id, lecturerId));
      }
    }

    // 3. Seed Curricula
    const curriculaCount = await db.select().from(siakadCurricula);
    let currId = "";
    if (curriculaCount.length === 0 && infId) {
      const insertedCurriculum = await db.insert(siakadCurricula).values([
        { name: "Kurikulum S1 Informatika 2024", studyProgramId: infId, yearEffective: 2024, totalSks: 144, totalSemester: 8, status: "aktif" }
      ]).returning();
      currId = insertedCurriculum[0]?.id || "";
    } else {
      currId = curriculaCount[0]?.id || "";
    }

    // 4. Seed Academic Periods
    const periodsCount = await db.select().from(siakadAcademicPeriods);
    let periodId = "";
    if (periodsCount.length === 0) {
      const [insertedPeriod] = await db.insert(siakadAcademicPeriods).values([
        { name: "Semester Ganjil 2026/2027", startDate: "2026-09-01", endDate: "2027-02-28", status: "berjalan" }
      ]).returning();
      periodId = insertedPeriod?.id || "";
    } else {
      periodId = periodsCount[0]?.id || "";
    }

    // 5. Seed Students
    const studentsCount = await db.select().from(siakadStudents);
    if (studentsCount.length === 0 && infId && currId && lecturerId) {
      await db.insert(siakadStudents).values([
        {
          nim: "26090182",
          fullName: "Budi Santoso",
          birthPlace: "Jakarta",
          birthDate: "2004-05-15",
          gender: "L" as const,
          religion: "Islam",
          address: "Jl. Siber Asia No. 10, Jakarta",
          studyProgramId: infId,
          angkatan: 2026,
          currentSemester: 1,
          academicStatus: "aktif" as const,
          dosenPaId: lecturerId,
          entryPath: "mandiri" as const,
          ipk: "0.00",
          totalSksLulus: 0,
          curriculumId: currId,
          personalEmail: "mahasiswa@example.com",
          phone: "081234567890",
          userId: mhsUserId,
        }
      ]);
    } else if (studentsCount.length > 0 && mhsUserId) {
      const mhs = studentsCount[0]!;
      if (mhs.userId !== mhsUserId || mhs.dosenPaId !== lecturerId) {
        await db.update(siakadStudents)
          .set({ userId: mhsUserId, dosenPaId: lecturerId })
          .where(eq(siakadStudents.id, mhs.id));
      }
    }

    // 6. Seed Courses & curriculum mappings
    const coursesCount = await db.select().from(siakadCourses);
    if (coursesCount.length === 0 && currId) {
      const coursesData = [
        { code: "INF101", name: "Pemrograman Dasar", sks: 4, type: "wajib" as const, semester: 1 },
        { code: "INF102", name: "Kalkulus I", sks: 3, type: "wajib" as const, semester: 1 },
        { code: "INF201", name: "Algoritma Lanjut & Kompleksitas", sks: 4, type: "wajib" as const, semester: 3 },
        { code: "INF202", name: "Basis Data Terdistribusi", sks: 3, type: "wajib" as const, semester: 3 },
        { code: "INF203", name: "Kecerdasan Buatan", sks: 3, type: "wajib" as const, semester: 3 }
      ];

      for (const item of coursesData) {
        const [insertedCourse] = await db.insert(siakadCourses).values({
          code: item.code,
          name: item.name,
          sks: item.sks,
          type: item.type,
          learningMode: "async"
        }).returning();

        if (insertedCourse) {
          await db.insert(siakadCurriculumCourses).values({
            curriculumId: currId,
            courseId: insertedCourse.id,
            semesterOffered: item.semester,
            courseType: "wajib_prodi"
          });
        }
      }
    }

    // 7. Seed Classes
    const classesCount = await db.select().from(siakadClasses);
    if (classesCount.length === 0 && periodId && infId && lecturerId) {
      const courses = await db.select().from(siakadCourses);
      for (const course of courses) {
        const [insertedClass] = await db.insert(siakadClasses).values({
          courseId: course.id,
          academicPeriodId: periodId,
          studyProgramId: infId,
          dosenUtamaId: lecturerId,
          className: "Kelas A PJJ",
          capacity: 40,
          enrolledCount: 0,
          mode: "async" as const,
          status: "aktif" as const,
        }).returning();

        if (insertedClass) {
          // Generate 16 sessions of weekly schedules starting from 2026-09-07
          const schedules = Array.from({ length: 16 }, (_, i) => {
            const dateObj = new Date("2026-09-07");
            dateObj.setDate(dateObj.getDate() + (i * 7));
            const sessionDate = dateObj.toISOString().split("T")[0]!;

            let sessionType: "reguler" | "libur" | "uts" | "uas" = "reguler";
            let topic = `Pertemuan ke-${i + 1} - Pembahasan Materi Utama`;
            if (i === 7) {
              sessionType = "uts" as const;
              topic = "Ujian Tengah Semester (UTS)";
            } else if (i === 15) {
              sessionType = "uas" as const;
              topic = "Ujian Akhir Semester (UAS)";
            }

            return {
              classId: insertedClass.id,
              sessionNumber: i + 1,
              topic,
              sessionDate,
              startTime: "08:00",
              endTime: "10:30",
              sessionType,
              vcLink: "https://meet.jit.si/unsia-pjj-kelas-virtual",
            };
          });

          await db.insert(siakadClassSchedules).values(schedules);
        }
      }
    }
  } catch (error) {
    console.error("Error seeding SIAKAD Database:", error);
  }
}
