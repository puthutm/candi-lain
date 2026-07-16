import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbExamQuestions, pmbExamSessions } from "@/db/schema/exam";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get("moduleId");
    const sessionId = searchParams.get("sessionId");

    if (!moduleId || !sessionId) {
      return NextResponse.json({ success: false, error: "Missing moduleId or sessionId" }, { status: 400 });
    }

    // Verify session exists and is active
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
      return NextResponse.json({ success: false, error: "Ujian untuk modul ini sudah selesai dikerjakan" }, { status: 400 });
    }

    // Update status to draf (ongoing) if it was belum_dikerjakan
    if (session.status === "belum_dikerjakan") {
      await db
        .update(pmbExamSessions)
        .set({
          status: "draf",
          startedAt: new Date(),
        })
        .where(eq(pmbExamSessions.id, sessionId));
    }

    // Fetch questions and select only safe fields (no correctAnswer)
    const questions = await db
      .select({
        id: pmbExamQuestions.id,
        examModuleId: pmbExamQuestions.examModuleId,
        questionText: pmbExamQuestions.questionText,
        questionType: pmbExamQuestions.questionType,
        options: pmbExamQuestions.options,
        imageUrl: pmbExamQuestions.imageUrl,
      })
      .from(pmbExamQuestions)
      .where(eq(pmbExamQuestions.examModuleId, moduleId));

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
