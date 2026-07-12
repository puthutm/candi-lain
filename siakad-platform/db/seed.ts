import { db } from "@/db";
import { siakadStudyPrograms, siakadCurricula, siakadAcademicPeriods, siakadCourses, siakadCurriculumCourses } from "@/db/schema/master";
import { siakadLecturers } from "@/db/schema/civitas";

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

    // 2. Seed Lecturers
    const lecturersCount = await db.select().from(siakadLecturers);
    if (lecturersCount.length === 0 && infId) {
      await db.insert(siakadLecturers).values([
        { nidn: "0421098501", fullName: "Dr. Hendra Setiawan, M.Kom.", studyProgramId: infId, position: "Lektor Kepala" }
      ]);
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
    if (periodsCount.length === 0) {
      await db.insert(siakadAcademicPeriods).values([
        { name: "Semester Ganjil 2026/2027", startDate: "2026-09-01", endDate: "2027-02-28", status: "berjalan" }
      ]);
    }

    // 5. Seed Courses & curriculum mappings
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
  } catch (error) {
    console.error("Error seeding SIAKAD Database:", error);
  }
}
