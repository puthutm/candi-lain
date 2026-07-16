import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { siakadLecturers, siakadStudents } from "@/db/schema/civitas";
import { siakadKrs, siakadKrsItems, siakadKrsApprovals } from "@/db/schema/krs";
import { siakadClasses } from "@/db/schema/classes";
import { siakadCourses, siakadAcademicPeriods, siakadStudyPrograms } from "@/db/schema/master";
import { eq, and, sql } from "drizzle-orm";
import { env } from "@/lib/env";

// Get advising students list and their KRS status
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("siakad_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);

    // Find lecturer by SSO userId
    const [lecturer] = await db
      .select()
      .from(siakadLecturers)
      .where(eq(siakadLecturers.userId, sessionUser.userId))
      .limit(1);

    if (!lecturer) {
      return NextResponse.json({ success: false, error: "Lecturer profile not found" }, { status: 403 });
    }

    // Get current active period
    const [activePeriod] = await db
      .select()
      .from(siakadAcademicPeriods)
      .where(eq(siakadAcademicPeriods.status, "berjalan"))
      .limit(1);

    if (!activePeriod) {
      return NextResponse.json({ success: true, students: [], period: null });
    }

    // Get all students under this lecturer's guidance
    const students = await db
      .select({
        studentId: siakadStudents.id,
        nim: siakadStudents.nim,
        fullName: siakadStudents.fullName,
        angkatan: siakadStudents.angkatan,
        currentSemester: siakadStudents.currentSemester,
        academicStatus: siakadStudents.academicStatus,
        ipk: siakadStudents.ipk,
        totalSksLulus: siakadStudents.totalSksLulus,
        studyProgramId: siakadStudents.studyProgramId,
        studyProgramName: siakadStudyPrograms.name,
      })
      .from(siakadStudents)
      .innerJoin(siakadStudyPrograms, eq(siakadStudents.studyProgramId, siakadStudyPrograms.id))
      .where(eq(siakadStudents.dosenPaId, lecturer.id));

    // Enrich with KRS details
    const enrichedStudents = await Promise.all(
      students.map(async (student) => {
        const [krs] = await db
          .select()
          .from(siakadKrs)
          .where(
            and(
              eq(siakadKrs.studentId, student.studentId),
              eq(siakadKrs.academicPeriodId, activePeriod.id)
            )
          )
          .limit(1);

        let krsDetails = null;

        if (krs) {
          const items = await db
            .select({
              itemId: siakadKrsItems.id,
              itemStatus: siakadKrsItems.status,
              classId: siakadKrsItems.classId,
              className: siakadClasses.className,
              courseCode: siakadCourses.code,
              courseName: siakadCourses.name,
              sks: siakadCourses.sks,
              courseType: siakadCourses.type,
            })
            .from(siakadKrsItems)
            .innerJoin(siakadClasses, eq(siakadKrsItems.classId, siakadClasses.id))
            .innerJoin(siakadCourses, eq(siakadClasses.courseId, siakadCourses.id))
            .where(eq(siakadKrsItems.krsId, krs.id));

          krsDetails = {
            id: krs.id,
            status: krs.status,
            totalSks: krs.totalSks,
            maxSksAllowed: krs.maxSksAllowed,
            submittedAt: krs.submittedAt,
            items,
          };
        }

        return {
          ...student,
          krs: krsDetails,
        };
      })
    );

    return NextResponse.json({
      success: true,
      students: enrichedStudents,
      period: activePeriod,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Approve or reject KRS
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("siakad_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role !== "dosen") {
      return NextResponse.json({ success: false, error: "Forbidden: Only lecturers can approve KRS" }, { status: 403 });
    }

    // Find lecturer by SSO userId
    const [lecturer] = await db
      .select()
      .from(siakadLecturers)
      .where(eq(siakadLecturers.userId, sessionUser.userId))
      .limit(1);

    if (!lecturer) {
      return NextResponse.json({ success: false, error: "Lecturer profile not found" }, { status: 403 });
    }

    const body = await req.json();
    const { krsId, action, note } = body;

    if (!krsId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "krsId and action (approve/reject) are required" }, { status: 400 });
    }

    if (action === "reject" && !note) {
      return NextResponse.json({ success: false, error: "Rejection note is required when rejecting a KRS" }, { status: 400 });
    }

    // Ensure the KRS belongs to a student under this Dosen PA's guidance
    const krsCheck = await db
      .select({
        krsId: siakadKrs.id,
        studentId: siakadStudents.id,
        studentUserId: siakadStudents.userId,
        studentNim: siakadStudents.nim,
      })
      .from(siakadKrs)
      .innerJoin(siakadStudents, eq(siakadKrs.studentId, siakadStudents.id))
      .where(
        and(
          eq(siakadKrs.id, krsId),
          eq(siakadStudents.dosenPaId, lecturer.id)
        )
      )
      .limit(1);

    if (krsCheck.length === 0) {
      return NextResponse.json({ success: false, error: "KRS submission not found or not under your guidance" }, { status: 404 });
    }

    const matchedKrs = krsCheck[0]!;

    const newKrsStatus = action === "approve" ? "disetujui_pa" : "ditolak";
    const newItemStatus = action === "approve" ? "disetujui" : "ditolak";

    // Update KRS Header Status
    await db
      .update(siakadKrs)
      .set({ status: newKrsStatus })
      .where(eq(siakadKrs.id, krsId));

    // Update KRS Items Status
    await db
      .update(siakadKrsItems)
      .set({ status: newItemStatus })
      .where(eq(siakadKrsItems.krsId, krsId));

    // Record KRS Approval Decision
    await db.insert(siakadKrsApprovals).values({
      krsId,
      dosenPaId: lecturer.id,
      action,
      note: note || null,
    });

    // If approved, increment enrolledCount and dispatch webhooks to LMS
    if (action === "approve") {
      const krsItemsList = await db
        .select({
          id: siakadKrsItems.id,
          classId: siakadKrsItems.classId,
        })
        .from(siakadKrsItems)
        .where(eq(siakadKrsItems.krsId, krsId));

      for (const item of krsItemsList) {
        // Increment enrolledCount
        await db
          .update(siakadClasses)
          .set({ enrolledCount: sql`${siakadClasses.enrolledCount} + 1` })
          .where(eq(siakadClasses.id, item.classId));

        // Dispatch LMS enrollment event webhook
        const payload = {
          event: "krs.approved",
          event_id: crypto.randomUUID(),
          occurred_at: new Date().toISOString(),
          data: {
            krs_item_id: item.id,
            class_id: item.classId,
            student_user_id: matchedKrs.studentUserId || matchedKrs.studentNim || "26090182",
          }
        };

        fetch(env.LMS_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(err => console.error("LMS webhook call failed:", err));
      }
    }

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "KRS successfully approved" : "KRS successfully rejected",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
