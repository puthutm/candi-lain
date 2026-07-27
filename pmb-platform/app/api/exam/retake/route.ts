import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbExamSessions } from "@/db/schema/exam";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, applicantId } = body;

    if (!sessionId || !applicantId) {
      return NextResponse.json({ success: false, error: "Missing sessionId or applicantId" }, { status: 400 });
    }

    // 1. Fetch the existing session
    const sessionList = await db
      .select()
      .from(pmbExamSessions)
      .where(eq(pmbExamSessions.id, sessionId))
      .limit(1);

    const session = sessionList[0];
    if (!session) {
      return NextResponse.json({ success: false, error: "Sesi ujian tidak ditemukan" }, { status: 404 });
    }

    // 2. Check if retake is allowed
    if (session.status !== "selesai_dikumpulkan") {
      return NextResponse.json({ success: false, error: "Hanya sesi yang sudah selesai yang bisa diulang" }, { status: 400 });
    }

    if (session.retakeCount >= session.maxRetakes) {
      return NextResponse.json({ success: false, error: "Batas maksimal pengulangan ujian untuk modul ini sudah tercapai" }, { status: 400 });
    }

    // 3. Create a new session for retake
    const [newSession] = await db
      .insert(pmbExamSessions)
      .values({
        applicantId,
        examModuleId: session.examModuleId,
        status: "belum_dikerjakan",
        timeRemainingSeconds: session.timeRemainingSeconds, // Same duration as original
        retakeCount: session.retakeCount + 1,
        maxRetakes: session.maxRetakes,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: `Sesi ulang modul berhasil dibuat (percobaan ke-${newSession!.retakeCount + 1} dari maksimal ${newSession!.maxRetakes})`,
      session: {
        id: newSession!.id,
        examModuleId: newSession!.examModuleId,
        status: newSession!.status,
        timeRemainingSeconds: newSession!.timeRemainingSeconds,
        retakeCount: newSession!.retakeCount,
        maxRetakes: newSession!.maxRetakes,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
