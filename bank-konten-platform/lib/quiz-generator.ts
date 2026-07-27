import { db } from "@/db";
import {
  questionBankItems,
  questionBankOptions,
  questionUsageLogs,
} from "@/db/schema/content";
import { eq, inArray } from "drizzle-orm";

export interface QuizQuestionOption {
  id: string;
  optionLabel: string;
  optionText: string;
  isCorrect: boolean;
}

export interface GeneratedQuizQuestion {
  id: string;
  questionText: string;
  questionType: string;
  difficultyLevel: string;
  bloomTaxonomy: string;
  options: QuizQuestionOption[];
}

export interface QuizPackageResult {
  success: boolean;
  courseCode: string;
  totalGenerated: number;
  questions: GeneratedQuizQuestion[];
}

export async function generateRandomQuizPackage(
  courseCode: string = "TPA-101",
  totalQuestions: number = 10,
  consumerSystem: string = "pmb",
  consumerExamRef: string = "CBT-PMB-2026"
): Promise<QuizPackageResult> {
  // Fetch verified questions for the course
  const questions = await db
    .select()
    .from(questionBankItems)
    .where(eq(questionBankItems.courseCode, courseCode))
    .limit(totalQuestions * 2);

  if (questions.length === 0) {
    // Fallback: fetch any verified question
    const fallbackQuestions = await db
      .select()
      .from(questionBankItems)
      .limit(totalQuestions);

    questions.push(...fallbackQuestions);
  }

  // Shuffle and select target count
  const selectedQuestions = questions
    .sort(() => 0.5 - Math.random())
    .slice(0, totalQuestions);

  const questionIds = selectedQuestions.map((q) => q.id);

  let optionsList: Array<{
    id: string;
    questionId: string;
    optionLabel: string;
    optionText: string;
    isCorrect: boolean;
  }> = [];

  if (questionIds.length > 0) {
    optionsList = await db
      .select()
      .from(questionBankOptions)
      .where(inArray(questionBankOptions.questionId, questionIds));
  }

  const resultQuestions: GeneratedQuizQuestion[] = [];

  for (const q of selectedQuestions) {
    const qOptions = optionsList
      .filter((o) => o.questionId === q.id)
      .map((o) => ({
        id: o.id,
        optionLabel: o.optionLabel,
        optionText: o.optionText,
        isCorrect: o.isCorrect,
      }));

    resultQuestions.push({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      difficultyLevel: q.difficultyLevel,
      bloomTaxonomy: q.bloomTaxonomy,
      options: qOptions,
    });

    // Log usage
    await db.insert(questionUsageLogs).values({
      questionId: q.id,
      consumerSystem,
      consumerExamRef,
    });

    // Update usage count
    await db
      .update(questionBankItems)
      .set({
        usageCount: (q.usageCount || 0) + 1,
        lastUsedAt: new Date(),
      })
      .where(eq(questionBankItems.id, q.id));
  }

  return {
    success: true,
    courseCode,
    totalGenerated: resultQuestions.length,
    questions: resultQuestions,
  };
}
