import { NextResponse } from "next/server";
import { db } from "@/db";
import { classEnrollments, lmsClasses } from "@/db/schema/classes";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { event, data } = payload;

    if (!event || !data) {
      return NextResponse.json({ success: false, error: "Invalid payload format" }, { status: 400 });
    }

    const { krs_item_id, class_id, student_user_id } = data;

    // 1. Fetch matching LMS class by siakadClassId
    const classesList = await db
      .select()
      .from(lmsClasses)
      .where(eq(lmsClasses.siakadClassId, class_id))
      .limit(1);

    if (classesList.length === 0) {
      return NextResponse.json({ success: false, error: "LMS class mapping not found. Sync first." }, { status: 404 });
    }

    const lmsClass = classesList[0]!;

    if (event === "krs.approved") {
      // 2. Check if already enrolled
      const existing = await db
        .select()
        .from(classEnrollments)
        .where(
          and(
            eq(classEnrollments.classId, lmsClass.id),
            eq(classEnrollments.userId, student_user_id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({
          success: true,
          message: "Student already enrolled in class (idempotent)",
          enrollment: existing[0],
        });
      }

      // 3. Create class enrollment
      const [newEnrollment] = await db
        .insert(classEnrollments)
        .values({
          classId: lmsClass.id,
          userId: student_user_id,
          role: "mahasiswa",
          krsItemRef: krs_item_id,
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: "KRS enrollment successfully processed in LMS!",
        enrollment: newEnrollment,
      });
    }

    if (event === "krs_item.cancelled") {
      // 4. Delete the enrollment
      await db
        .delete(classEnrollments)
        .where(
          and(
            eq(classEnrollments.classId, lmsClass.id),
            eq(classEnrollments.userId, student_user_id)
          )
        );

      return NextResponse.json({
        success: true,
        message: "KRS item cancelled and student enrollment dropped in LMS.",
      });
    }

    return NextResponse.json({ success: false, error: "Unsupported event type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
