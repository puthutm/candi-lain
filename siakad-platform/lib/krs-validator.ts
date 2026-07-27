import { db } from "@/db";
import {
  siakadStudents,
  siakadKrs,
  siakadKrsItems,
  siakadClasses,
  siakadCourses,
  siakadCoursePrerequisites,
  siakadGrades,
  siakadClassSchedules,
} from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";

/**
 * Hitung SKS Maksimal berdasarkan IPS semester sebelumnya
 */
export function calculateMaxSksAllowed(
  ipsLastSemester: number,
  isFirstSemester: boolean = false
): number {
  if (isFirstSemester) return 20; // Default KRS Perdana Paket

  if (ipsLastSemester >= 3.5) {
    return 24;
  } else if (ipsLastSemester >= 3.0) {
    return 22;
  } else if (ipsLastSemester >= 2.5) {
    return 20;
  } else {
    return 18;
  }
}

export interface KrsValidationResult {
  valid: boolean;
  errors: string[];
  totalSks: number;
  maxSksAllowed: number;
}

export async function validateKrsSubmission(
  studentId: string,
  classIds: string[],
  academicPeriodId: string
): Promise<KrsValidationResult> {
  const errors: string[] = [];

  // 1. Get student profile
  const [student] = await db
    .select()
    .from(siakadStudents)
    .where(eq(siakadStudents.id, studentId));

  if (!student) {
    return { valid: false, errors: ["Mahasiswa tidak ditemukan"], totalSks: 0, maxSksAllowed: 0 };
  }

  // 2. Fetch classes with courses info
  if (classIds.length === 0) {
    return { valid: false, errors: ["Tidak ada kelas yang dipilih"], totalSks: 0, maxSksAllowed: 0 };
  }

  const selectedClasses = await db
    .select({
      classId: siakadClasses.id,
      className: siakadClasses.name,
      courseId: siakadCourses.id,
      courseName: siakadCourses.name,
      sks: siakadCourses.sks,
      enrolledCount: siakadClasses.enrolledCount,
      capacity: siakadClasses.capacity,
    })
    .from(siakadClasses)
    .innerJoin(siakadCourses, eq(siakadClasses.courseId, siakadCourses.id))
    .where(inArray(siakadClasses.id, classIds));

  const totalSks = selectedClasses.reduce((sum, item) => sum + item.sks, 0);

  // 3. Calculate max SKS allowed (assuming default 22 for now or calculate from past grades)
  const maxSksAllowed = calculateMaxSksAllowed(3.2, false);

  if (totalSks > maxSksAllowed) {
    errors.push(
      `Total ${totalSks} SKS melebihi batas maksimal ${maxSksAllowed} SKS yang diizinkan untuk Anda.`
    );
  }

  // 4. Check class capacity
  for (const cls of selectedClasses) {
    if (cls.enrolledCount >= cls.capacity) {
      errors.push(`Kelas ${cls.courseName} (${cls.className}) sudah memenuhi kapasitas kuota (${cls.capacity} mahasiswa).`);
    }
  }

  // 5. Check course prerequisites
  const courseIds = selectedClasses.map((c) => c.courseId);
  if (courseIds.length > 0) {
    const prereqs = await db
      .select({
        courseId: siakadCoursePrerequisites.courseId,
        prereqCourseId: siakadCoursePrerequisites.prerequisiteCourseId,
        mustPass: siakadCoursePrerequisites.mustPass,
      })
      .from(siakadCoursePrerequisites)
      .where(inArray(siakadCoursePrerequisites.courseId, courseIds));

    for (const prereq of prereqs) {
      if (prereq.mustPass) {
        const passedGrade = await db
          .select()
          .from(siakadGrades)
          .where(
            and(
              eq(siakadGrades.studentId, studentId),
              eq(siakadGrades.letterGrade, "A") // simplified passed check
            )
          );

        // If not passed prerequisite
        if (passedGrade.length === 0) {
          const targetCourse = selectedClasses.find((c) => c.courseId === prereq.courseId);
          errors.push(
            `Prasyarat untuk mata kuliah '${targetCourse?.courseName || "Tujuan"}' belum terpenuhi.`
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    totalSks,
    maxSksAllowed,
  };
}
