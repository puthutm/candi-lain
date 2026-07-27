/**
 * NIM Generator & Selection Recommendation Utility for UNSIA PMB Platform
 */

export function generateStudentNim(
  studyProgramCode: string = "301",
  entryPathCode: string = "01",
  sequenceNumber: number = 1,
  entryYear: number = new Date().getFullYear()
): string {
  const yearPrefix = String(entryYear).slice(-2); // e.g. "26" for 2026
  
  // Format prodi code to 3 digits (e.g., "301")
  const formattedProdi = studyProgramCode.padStart(3, "0").slice(-3);
  
  // Format entry path code to 2 digits (e.g., "01")
  const formattedPath = entryPathCode.padStart(2, "0").slice(-2);
  
  // Format sequence to 4 digits (e.g., "0045")
  const formattedSeq = String(sequenceNumber).padStart(4, "0").slice(-4);

  return `${yearPrefix}${formattedProdi}${formattedPath}${formattedSeq}`;
}

export function calculatePassingRecommendation(score: number): {
  recommendation: "DIREKOMENDASIKAN" | "PERLU_PERTIMBANGAN" | "TIDAK_LULUS";
  label: string;
  badgeColor: string;
} {
  if (score >= 75) {
    return {
      recommendation: "DIREKOMENDASIKAN",
      label: "Direkomendasikan Lulus",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };
  } else if (score >= 50) {
    return {
      recommendation: "PERLU_PERTIMBANGAN",
      label: "Perlu Pertimbangan",
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
  } else {
    return {
      recommendation: "TIDAK_LULUS",
      label: "Tidak Direkomendasikan",
      badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    };
  }
}
