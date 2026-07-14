import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { siakadStudents, siakadLecturers } from "@/db/schema/civitas";
import { siakadKrs, siakadKrsItems, siakadKrsApprovals } from "@/db/schema/krs";
import { siakadClasses } from "@/db/schema/classes";
import { siakadCourses, siakadAcademicPeriods } from "@/db/schema/master";
import { eq, and } from "drizzle-orm";

// Get pending KRS submissions for admin
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("siakad_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get active period
    const [activePeriod] = await db
      .select()
      .from(siakadAcademicPeriods)
      .where(eq(siakadAcademicPeriods.status, "berjalan"))
      .limit(1);

    if (!activePeriod) {
      return NextResponse.json({ success: true, submissions: [], period: null });
    }

    // Get all submitted KRS (status = diajukan)
    const krsRows = await db
      .select({
        krsId: siakadKrs.id,
        studentId: siakadKrs.studentId,
        totalSks: siakadKrs.totalSks,
        status: siakadKrs.status,
        submittedAt: siakadKrs.submittedAt,
        nim: siakadStudents.nim,
        fullName: siakadStudents.fullName,
      })
      .from(siakadKrs)
      .innerJoin(siakadStudents, eq(siakadKrs.studentId, siakadStudents.id))
      .where(
        and(
          eq(siakadKrs.academicPeriodId, activePeriod.id),
          eq(siakadKrs.status, "diajukan")
        )
      );

    // Enrich with course details
    const submissions = await Promise.all(
      krsRows.map(async (krs) => {
        const items = await db
          .select({
            courseCode: siakadCourses.code,
            courseName: siakadCourses.name,
            sks: siakadCourses.sks,
          })
          .from(siakadKrsItems)
          .innerJoin(siakadClasses, eq(siakadKrsItems.classId, siakadClasses.id))
          .innerJoin(siakadCourses, eq(siakadClasses.courseId, siakadCourses.id))
          .where(eq(siakadKrsItems.krsId, krs.krsId));

        return {
          id: krs.krsId,
          name: krs.fullName,
          nim: krs.nim || "-",
          sksCount: krs.totalSks,
          status: krs.status,
          submittedAt: krs.submittedAt,
          courses: items.map((i) => `${i.courseCode}: ${i.courseName} (${i.sks} SKS)`),
        };
      })
    );

    return NextResponse.json({
      success: true,
      submissions,
      period: activePeriod,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Approve or reject a KRS submission
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("siakad_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);
    const body = await req.json();
    const { krsId, action, note } = body;

    if (!krsId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "krsId and action (approve/reject) required" }, { status: 400 });
    }

    if (action === "reject" && !note) {
      return NextResponse.json({ success: false, error: "Catatan penolakan wajib diisi" }, { status: 400 });
    }

    // Find lecturer (PA or admin)
    const [lecturer] = await db
      .select({ id: siakadLecturers.id })
      .from(siakadLecturers)
      .where(eq(siakadLecturers.userId, sessionUser.userId))
      .limit(1);

    const newKrsStatus = action === "approve" ? "disetujui_pa" : "ditolak";
    const newItemStatus = action === "approve" ? "disetujui" : "ditolak";

    // Update KRS status
    await db
      .update(siakadKrs)
      .set({ status: newKrsStatus })
      .where(eq(siakadKrs.id, krsId));

    // Update all KRS items
    await db
      .update(siakadKrsItems)
      .set({ status: newItemStatus })
      .where(eq(siakadKrsItems.krsId, krsId));

    // Record approval
    if (lecturer) {
      await db.insert(siakadKrsApprovals).values({
        krsId,
        dosenPaId: lecturer.id,
        action,
        note: note || null,
      });
    }

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "KRS berhasil disetujui" : "KRS ditolak",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
