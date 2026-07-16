import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbExamModules, pmbExamSessions } from "@/db/schema/exam";
import { eq, and } from "drizzle-orm";

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

      mappedModules.push({
        id: mod.id,
        code: mod.code,
        name: mod.name,
        durationMinutes: mod.durationMinutes,
        questionCount: mod.questionCount,
        type: mod.type,
        status: session.status, // "belum_dikerjakan", "draf", "selesai_dikumpulkan"
        sessionId: session.id,
        timeRemainingSeconds: session.timeRemainingSeconds,
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
