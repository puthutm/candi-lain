import { NextResponse } from "next/server";
import { db } from "@/db";
import { videoConferences, vcAttendances } from "@/db/schema/vicon";
import { eq, and, isNull } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, videoConferenceId, action } = body; // action can be "join" or "leave"

    if (!userId || !videoConferenceId || !action) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // Find conference details
      const confList = await tx
        .select()
        .from(videoConferences)
        .where(eq(videoConferences.id, videoConferenceId))
        .limit(1);

      if (confList.length === 0) {
        throw new Error("Sesi video conference tidak ditemukan");
      }
      const conf = confList[0]!;

      if (action === "join") {
        // Record join log
        const [joinedLog] = await tx
          .insert(vcAttendances)
          .values({
            videoConferenceId,
            userId,
            joinedAt: new Date(),
            leftAt: null,
            countedAsPresent: false,
          })
          .returning();

        return { action, joinedLog };
      } else {
        // action === "leave"
        // Find existing join log where leftAt is null
        const existingAttendance = await tx
          .select()
          .from(vcAttendances)
          .where(
            and(
              eq(vcAttendances.videoConferenceId, videoConferenceId),
              eq(vcAttendances.userId, userId),
              isNull(vcAttendances.leftAt)
            )
          )
          .limit(1)
          .for("update");

        if (existingAttendance.length === 0) {
          throw new Error("Data join conference tidak ditemukan");
        }

        const attendance = existingAttendance[0]!;
        const leftAt = new Date();
        const joinedAt = attendance.joinedAt;

        // Calculate presence threshold (75%)
        const presenceThreshold = 0.75;
        const durationMinutes = conf.durationMinutes;
        
        // Calculate duration present in minutes
        const elapsedMinutes = (leftAt.getTime() - joinedAt.getTime()) / (1000 * 60);
        const countedAsPresent = elapsedMinutes >= (durationMinutes * presenceThreshold);

        const [updatedLog] = await tx
          .update(vcAttendances)
          .set({
            leftAt,
            countedAsPresent,
          })
          .where(eq(vcAttendances.id, attendance.id))
          .returning();

        return { action, updatedLog, durationMinutes, elapsedMinutes, countedAsPresent };
      }
    });

    return NextResponse.json({
      success: true,
      message: `Presensi conference berhasil dicatat untuk ${action}!`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
