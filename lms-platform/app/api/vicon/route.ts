import { NextResponse } from "next/server";
import { db } from "@/db";
import { videoConferences } from "@/db/schema/vicon";
import { lmsSessions } from "@/db/schema/sessions";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, durationMinutes } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
    }

    // Verify session
    const session = await db
      .select()
      .from(lmsSessions)
      .where(eq(lmsSessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const meetingRoomName = `UNSIA-Meet-${sessionId.slice(0, 8)}`;
    const meetingLink = `https://meet.jit.si/${meetingRoomName}`;

    const [vicon] = await db
      .insert(videoConferences)
      .values({
        sessionId,
        title: `Virtual Conference - Sesi ${session[0]!.sessionNumber}`,
        provider: "jitsi_internal",
        meetingLink,
        durationMinutes: durationMinutes || 90,
        status: "terjadwal",
      })
      .returning();

    return NextResponse.json({ success: true, vicon });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
