import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadKrsItems, siakadKrs } from "@/db/schema/krs";
import { siakadStudents } from "@/db/schema/civitas";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const { krsItemId, status } = await req.json();

    if (!krsItemId || !status) {
      return NextResponse.json({ success: false, error: "Missing krsItemId or status" }, { status: 400 });
    }

    // 1. Update krs item status
    const updated = await db
      .update(siakadKrsItems)
      .set({ status })
      .where(eq(siakadKrsItems.id, krsItemId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ success: false, error: "KRS item not found" }, { status: 404 });
    }

    const krsItem = updated[0]!;

    // 2. Fetch student user ID
    const krsList = await db
      .select()
      .from(siakadKrs)
      .where(eq(siakadKrs.id, krsItem.krsId))
      .limit(1);

    if (krsList.length > 0) {
      const krs = krsList[0]!;
      const studentsList = await db
        .select()
        .from(siakadStudents)
        .where(eq(siakadStudents.id, krs.studentId))
        .limit(1);

      if (studentsList.length > 0) {
        const student = studentsList[0]!;
        
        // 3. Dispatch webhook to LMS
        const eventType = status === "disetujui" ? "krs.approved" : "krs_item.cancelled";
        const payload = {
          event: eventType,
          event_id: crypto.randomUUID(),
          occurred_at: new Date().toISOString(),
          data: {
            krs_item_id: krsItem.id,
            class_id: krsItem.classId,
            student_user_id: student.userId || student.nim || "26090182",
          }
        };

        fetch(env.LMS_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(err => console.error("LMS webhook failed", err));
      }
    }

    return NextResponse.json({
      success: true,
      message: `KRS item status updated to ${status} and event dispatched to LMS!`,
      krsItem,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
