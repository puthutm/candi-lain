import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { siakadStudents } from "@/db/schema/civitas";
import { siakadKrs, siakadKrsItems } from "@/db/schema/krs";
import { siakadClasses } from "@/db/schema/classes";
import { siakadCourses, siakadAcademicPeriods } from "@/db/schema/master";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("siakad_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);

    // Find student
    const [student] = await db
      .select({ id: siakadStudents.id })
      .from(siakadStudents)
      .where(eq(siakadStudents.userId, sessionUser.userId))
      .limit(1);

    if (!student) {
      return NextResponse.json({ success: true, krs: null, courses: [] });
    }

    // Get current active period
    const [activePeriod] = await db
      .select()
      .from(siakadAcademicPeriods)
      .where(eq(siakadAcademicPeriods.status, "berjalan"))
      .limit(1);

    if (!activePeriod) {
      return NextResponse.json({ success: true, krs: null, courses: [], period: null });
    }

    // Get the student's KRS for active period
    const [krs] = await db
      .select()
      .from(siakadKrs)
      .where(
        and(
          eq(siakadKrs.studentId, student.id),
          eq(siakadKrs.academicPeriodId, activePeriod.id)
        )
      )
      .limit(1);

    // Get KRS items with course details
    let courses: any[] = [];
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

      courses = items;
    }

    // Also get available classes for KRS selection (if KRS is draft or doesn't exist yet)
    let availableClasses: any[] = [];
    if (!krs || krs.status === "draft") {
      const classes = await db
        .select({
          classId: siakadClasses.id,
          className: siakadClasses.className,
          courseCode: siakadCourses.code,
          courseName: siakadCourses.name,
          sks: siakadCourses.sks,
          courseType: siakadCourses.type,
          capacity: siakadClasses.capacity,
          enrolledCount: siakadClasses.enrolledCount,
        })
        .from(siakadClasses)
        .innerJoin(siakadCourses, eq(siakadClasses.courseId, siakadCourses.id))
        .where(
          and(
            eq(siakadClasses.academicPeriodId, activePeriod.id),
            eq(siakadClasses.status, "aktif")
          )
        );

      availableClasses = classes;
    }

    return NextResponse.json({
      success: true,
      krs: krs || null,
      courses,
      availableClasses,
      period: activePeriod,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Submit KRS
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("siakad_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);
    const body = await req.json();
    const { classIds } = body;

    if (!classIds || classIds.length === 0) {
      return NextResponse.json({ success: false, error: "Pilih minimal 1 mata kuliah" }, { status: 400 });
    }

    // Find student
    const [student] = await db
      .select({ id: siakadStudents.id })
      .from(siakadStudents)
      .where(eq(siakadStudents.userId, sessionUser.userId))
      .limit(1);

    if (!student) {
      return NextResponse.json({ success: false, error: "Data mahasiswa tidak ditemukan" }, { status: 404 });
    }

    // Get active period
    const [activePeriod] = await db
      .select()
      .from(siakadAcademicPeriods)
      .where(eq(siakadAcademicPeriods.status, "berjalan"))
      .limit(1);

    if (!activePeriod) {
      return NextResponse.json({ success: false, error: "Belum ada periode akademik aktif" }, { status: 400 });
    }

    // Calculate total SKS from selected classes
    let totalSks = 0;
    for (const classId of classIds) {
      const [cls] = await db
        .select({ sks: siakadCourses.sks })
        .from(siakadClasses)
        .innerJoin(siakadCourses, eq(siakadClasses.courseId, siakadCourses.id))
        .where(eq(siakadClasses.id, classId))
        .limit(1);
      if (cls) totalSks += cls.sks;
    }

    // Check if KRS already exists
    const [existingKrs] = await db
      .select()
      .from(siakadKrs)
      .where(
        and(
          eq(siakadKrs.studentId, student.id),
          eq(siakadKrs.academicPeriodId, activePeriod.id)
        )
      )
      .limit(1);

    let krsId: string;
    if (existingKrs) {
      // Update existing
      await db
        .update(siakadKrs)
        .set({ totalSks, status: "diajukan", submittedAt: new Date() })
        .where(eq(siakadKrs.id, existingKrs.id));
      krsId = existingKrs.id;

      // Remove old items
      await db.delete(siakadKrsItems).where(eq(siakadKrsItems.krsId, krsId));
    } else {
      // Create new KRS
      const [newKrs] = await db
        .insert(siakadKrs)
        .values({
          studentId: student.id,
          academicPeriodId: activePeriod.id,
          totalSks,
          status: "diajukan",
          submittedAt: new Date(),
        })
        .returning();
      krsId = newKrs!.id;
    }

    // Insert KRS items
    for (const classId of classIds) {
      await db.insert(siakadKrsItems).values({
        krsId,
        classId,
        status: "diajukan",
      });
    }

    return NextResponse.json({
      success: true,
      message: `KRS berhasil diajukan dengan ${classIds.length} mata kuliah (${totalSks} SKS)`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
