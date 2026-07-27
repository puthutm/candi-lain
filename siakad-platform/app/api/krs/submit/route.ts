import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siakadKrs, siakadKrsItems } from "@/db/schema";
import { validateKrsSubmission } from "@/lib/krs-validator";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, academicPeriodId, classIds } = body;

    if (!studentId || !academicPeriodId || !Array.isArray(classIds)) {
      return NextResponse.json(
        { success: false, error: "studentId, academicPeriodId, dan classIds wajib diisi" },
        { status: 400 }
      );
    }

    // Validate KRS
    const validation = await validateKrsSubmission(studentId, classIds, academicPeriodId);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: "Validasi KRS Gagal", errors: validation.errors },
        { status: 422 }
      );
    }

    // Check existing KRS or create new
    const existingKrs = await db
      .select()
      .from(siakadKrs)
      .where(
        and(
          eq(siakadKrs.studentId, studentId),
          eq(siakadKrs.academicPeriodId, academicPeriodId)
        )
      );

    let krsId = existingKrs[0]?.id;

    if (krsId) {
      // Clear previous draft items
      await db.delete(siakadKrsItems).where(eq(siakadKrsItems.krsId, krsId));

      await db
        .update(siakadKrs)
        .set({
          status: "diajukan",
          totalSks: validation.totalSks,
          maxSksAllowed: validation.maxSksAllowed,
          submittedAt: new Date(),
        })
        .where(eq(siakadKrs.id, krsId));
    } else {
      const [newKrs] = await db
        .insert(siakadKrs)
        .values({
          studentId,
          academicPeriodId,
          status: "diajukan",
          totalSks: validation.totalSks,
          maxSksAllowed: validation.maxSksAllowed,
          submittedAt: new Date(),
        })
        .returning();

      krsId = newKrs.id;
    }

    // Insert KRS items
    const krsItemsData = classIds.map((cId: string) => ({
      krsId,
      classId: cId,
      status: "diajukan" as const,
    }));

    await db.insert(siakadKrsItems).values(krsItemsData);

    return NextResponse.json({
      success: true,
      message: "KRS berhasil diajukan ke Dosen Pembimbing Akademik!",
      krsId,
      totalSks: validation.totalSks,
    });
  } catch (error: any) {
    console.error("[KRS Submit Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengajukan KRS" },
      { status: 500 }
    );
  }
}
