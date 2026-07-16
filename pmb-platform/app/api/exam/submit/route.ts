import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbExamQuestions, pmbExamSessions, pmbExamAnswers, pmbExamResults } from "@/db/schema/exam";
import { pmbApplicants } from "@/db/schema/applicants";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, answers, timeRemainingSeconds } = body;

    if (!sessionId || !answers) {
      return NextResponse.json({ success: false, error: "Missing sessionId or answers" }, { status: 400 });
    }

    // 1. Fetch the exam session
    const sessionList = await db
      .select()
      .from(pmbExamSessions)
      .where(eq(pmbExamSessions.id, sessionId))
      .limit(1);

    const session = sessionList[0];
    if (!session) {
      return NextResponse.json({ success: false, error: "Sesi ujian tidak ditemukan" }, { status: 404 });
    }

    if (session.status === "selesai_dikumpulkan") {
      return NextResponse.json({ success: false, error: "Ujian untuk modul ini sudah dikumpulkan sebelumnya" }, { status: 400 });
    }

    // 2. Fetch all questions for this module to grade them
    const questions = await db
      .select()
      .from(pmbExamQuestions)
      .where(eq(pmbExamQuestions.examModuleId, session.examModuleId));

    let correctCount = 0;
    const answerInserts = [];

    for (const q of questions) {
      const studentAnswer = answers[q.id] || ""; // matching the question ID
      
      // Save answer log
      answerInserts.push({
        examSessionId: session.id,
        examQuestionId: q.id,
        answerValue: studentAnswer,
      });

      // Grade the answer (case insensitive match)
      if (studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        correctCount++;
      }
    }

    // Insert answers to database
    if (answerInserts.length > 0) {
      await db.insert(pmbExamAnswers).values(answerInserts);
    }

    // Calculate score
    const totalQuestions = questions.length || 1;
    const score = (correctCount / totalQuestions) * 100;
    const passed = score >= 60; // passing threshold

    // Save exam results
    await db.insert(pmbExamResults).values({
      applicantId: session.applicantId,
      examModuleId: session.examModuleId,
      score: score.toFixed(2),
      passed,
      gradedAt: new Date(),
    });

    // Update exam session status
    await db
      .update(pmbExamSessions)
      .set({
        status: "selesai_dikumpulkan",
        submittedAt: new Date(),
        timeRemainingSeconds: timeRemainingSeconds !== undefined ? timeRemainingSeconds : 0,
      })
      .where(eq(pmbExamSessions.id, session.id));

    // 3. Check if all sessions/modules for this applicant are completed
    const allSessions = await db
      .select()
      .from(pmbExamSessions)
      .where(eq(pmbExamSessions.applicantId, session.applicantId));

    const allDone = allSessions.every((s) => s.status === "selesai_dikumpulkan");

    if (allDone) {
      // Auto-graduate current stage to selesai_ujian
      await db
        .update(pmbApplicants)
        .set({
          currentStage: "selesai_ujian",
          updatedAt: new Date(),
        })
        .where(eq(pmbApplicants.id, session.applicantId));
    }

    return NextResponse.json({
      success: true,
      score,
      passed,
      allCompleted: allDone,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
