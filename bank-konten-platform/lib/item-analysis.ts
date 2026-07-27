import { db } from "@/db";
import { questionBankItems, questionItemAnalysis } from "@/db/schema/content";
import { eq } from "drizzle-orm";

export interface ItemAnalysisResult {
  questionId: string;
  respondentCount: number;
  correctRate: number;
  discriminationIndex: number;
  qualityFlag: "baik" | "perlu_revisi";
}

export async function computeItemAnalysis(
  questionId: string,
  respondentCount: number,
  correctCount: number,
  discriminationIndex: number = 0.35,
  consumerSystem: string = "pmb",
  consumerExamRef: string = "CBT-ANALYTICS"
): Promise<ItemAnalysisResult> {
  const correctRate =
    respondentCount > 0 ? Math.round((correctCount / respondentCount) * 100) / 100 : 0;

  // Determine Quality Flag
  // Standard Item Analysis: Difficulty Rate between 0.20 - 0.80 and Discrimination Index >= 0.30 is "baik"
  let qualityFlag: "baik" | "perlu_revisi" = "baik";
  if (correctRate < 0.2 || correctRate > 0.85 || discriminationIndex < 0.25) {
    qualityFlag = "perlu_revisi";
  }

  // Insert Item Analysis Record
  await db.insert(questionItemAnalysis).values({
    questionId,
    consumerSystem,
    consumerExamRef,
    respondentCount,
    correctRate: String(correctRate),
    discriminationIndex: String(discriminationIndex),
  });

  // Update Question Item Quality Flag
  await db
    .update(questionBankItems)
    .set({
      qualityFlag,
    })
    .where(eq(questionBankItems.id, questionId));

  return {
    questionId,
    respondentCount,
    correctRate,
    discriminationIndex,
    qualityFlag,
  };
}
