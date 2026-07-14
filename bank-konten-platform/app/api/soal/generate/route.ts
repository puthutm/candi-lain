import { NextResponse } from "next/server";
import { db } from "@/db";
import { questionBankItems, questionBankOptions, questionUsageLogs } from "@/db/schema/content";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseCode, totalQuestions, difficultyDistribution, consumerSystem, consumerExamRef } = body;

    if (!courseCode || !totalQuestions || !difficultyDistribution) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Parse distribution
    // e.g. { mudah: 30, sedang: 50, sulit: 20 } represent percentages
    const dist = typeof difficultyDistribution === "string" 
      ? JSON.parse(difficultyDistribution) 
      : difficultyDistribution;

    // Fetch all published questions for this course
    const allPublished = await db
      .select()
      .from(questionBankItems)
      .where(
        and(
          eq(questionBankItems.courseCode, courseCode),
          eq(questionBankItems.verificationStatus, "terbit")
        )
      );

    if (allPublished.length === 0) {
      return NextResponse.json({ error: "No published questions found for this course" }, { status: 404 });
    }

    // Allocate counts based on percentages
    const generatedQuestions: any[] = [];
    const difficultyKeys = ["mudah", "sedang", "sulit"];

    for (const key of difficultyKeys) {
      const percentage = dist[key] || 0;
      if (percentage <= 0) continue;

      const targetCount = Math.round((percentage / 100) * totalQuestions);
      if (targetCount <= 0) continue;

      // Filter by difficulty level and shuffle randomly
      const pool = allPublished
        .filter(q => q.difficultyLevel === key)
        .sort(() => 0.5 - Math.random()); // Random sort

      // Pick up to targetCount
      const chosen = pool.slice(0, targetCount);
      generatedQuestions.push(...chosen);
    }

    // Fallback: if the distribution choice didn't fill the total count, fill it with remaining items
    if (generatedQuestions.length < totalQuestions) {
      const chosenIds = new Set(generatedQuestions.map(q => q.id));
      const remainingPool = allPublished
        .filter(q => !chosenIds.has(q.id))
        .sort(() => 0.5 - Math.random());
      
      const extraNeeded = totalQuestions - generatedQuestions.length;
      generatedQuestions.push(...remainingPool.slice(0, extraNeeded));
    }

    // Fetch options for each chosen question, increment usage_count, and log usage
    const results = [];
    for (const item of generatedQuestions) {
      // 1. Fetch options
      const options = await db
        .select()
        .from(questionBankOptions)
        .where(eq(questionBankOptions.questionId, item.id));

      // 2. Increment usage count
      await db
        .update(questionBankItems)
        .set({
          usageCount: item.usageCount + 1,
          lastUsedAt: new Date(),
        })
        .where(eq(questionBankItems.id, item.id));

      // 3. Log usage if consumer metadata is passed
      if (consumerSystem && consumerExamRef) {
        await db
          .insert(questionUsageLogs)
          .values({
            questionId: item.id,
            consumerSystem,
            consumerExamRef,
          });
      }

      results.push({
        ...item,
        options,
      });
    }

    return NextResponse.json({ success: true, questions: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
