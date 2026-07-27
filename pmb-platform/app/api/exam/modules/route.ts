import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbExamModules, pmbExamSessions, pmbExamResults } from "@/db/schema/exam";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const applicantId = searchParams.get("applicantId");

    if (!applicantId) {
      return NextResponse.json({ success: false, error: "Missing applicantId" }, { status: 400 });
    }

    // 1. Fetch all active modules
    const modules = await db
      .select()
      .from(pmbExamModules)
      .where(eq(pmbExamModules.isActive, true));

    // 2. Fetch or create exam sessions for this applicant
    const mappedModules = [];
    for (const mod of modules) {
      // Find session
      const existing = await db
        .select()
        .from(pmbExamSessions)
        .where(
          and(
            eq(pmbExamSessions.applicantId, applicantId),
            eq(pmbExamSessions.examModuleId, mod.id)
          )
        )
        .orderBy(desc(pmbExamSessions.startedAt))
        .limit(1);

      let session = existing[0];
      if (!session) {
        // Create default session
        const [inserted] = await db
          .insert(pmbExamSessions)
          .values({
            applicantId,
            examModuleId: mod.id,
            status: "belum_dikerjakan",
            timeRemainingSeconds: mod.durationMinutes * 60,
          })
          .returning();
        session = inserted!;
      }

      // Check if retake is allowed
      const canRetake = session.status === "selesai_dikumpulkan" && session.retakeCount < session.maxRetakes;

      // Get previous results if any
      const previousResults = await db
        .select()
        .from(pmbExamResults)
        .where(
          and(
            eq(pmbExamResults.applicantId, applicantId),
            eq(pmbExamResults.examModuleId, mod.id)
          )
        )
        .orderBy(desc(pmbExamResults.gradedAt));

      mappedModules.push({
        id: mod.id,
        code: mod.code,
        name: mod.name,
        durationMinutes: mod.durationMinutes,
        questionCount: mod.questionCount,
        type: mod.type,
        status: session.status,
        sessionId: session.id,
        timeRemainingSeconds: session.timeRemainingSeconds,
        retakeCount: session.retakeCount,
        maxRetakes: session.maxRetakes,
        canRetake,
        previousResults: previousResults.map(r => ({
          score: r.score,
          passed: r.passed,
          gradedAt: r.gradedAt,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      modules: mappedModules,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
