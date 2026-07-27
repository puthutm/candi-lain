/**
 * Calculation helper for SIAKAD Grades and GPA (IPS/IPK)
 */

export interface GradeConversion {
  letterGrade: "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "D" | "E";
  gradePoint: number;
}

export function convertScoreToGrade(score: number): GradeConversion {
  if (score >= 85) return { letterGrade: "A", gradePoint: 4.0 };
  if (score >= 80) return { letterGrade: "A-", gradePoint: 3.75 };
  if (score >= 75) return { letterGrade: "B+", gradePoint: 3.5 };
  if (score >= 70) return { letterGrade: "B", gradePoint: 3.0 };
  if (score >= 65) return { letterGrade: "B-", gradePoint: 2.75 };
  if (score >= 60) return { letterGrade: "C+", gradePoint: 2.5 };
  if (score >= 55) return { letterGrade: "C", gradePoint: 2.0 };
  if (score >= 45) return { letterGrade: "D", gradePoint: 1.0 };
  return { letterGrade: "E", gradePoint: 0.0 };
}

export function calculateFinalScore(
  tugas: number = 0,
  kuis: number = 0,
  uts: number = 0,
  uas: number = 0,
  attendance: number = 100
): number {
  // Bobot standar: Kehadiran 10%, Tugas 20%, Kuis 10%, UTS 30%, UAS 30%
  const finalScore =
    attendance * 0.1 + tugas * 0.2 + kuis * 0.1 + uts * 0.3 + uas * 0.3;
  return Math.round(finalScore * 100) / 100;
}

export function calculateGpa(
  courses: { sks: number; gradePoint: number }[]
): { gpa: number; totalSks: number; totalMutu: number } {
  if (courses.length === 0) return { gpa: 0.0, totalSks: 0, totalMutu: 0.0 };

  const totalSks = courses.reduce((acc, c) => acc + c.sks, 0);
  const totalMutu = courses.reduce((acc, c) => acc + c.sks * c.gradePoint, 0);

  const gpa = totalSks > 0 ? Math.round((totalMutu / totalSks) * 100) / 100 : 0.0;

  return { gpa, totalSks, totalMutu };
}
