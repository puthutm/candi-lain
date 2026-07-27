import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants, pmbApplicantStatusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculatePassingRecommendation } from "@/lib/nim-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicantId, currentStage, totalExamScore, note, changedByStaffId } = body;

    if (!applicantId || !currentStage) {
      return NextResponse.json(
        { success: false, error: "applicantId dan currentStage wajib diisi" },
        { status: 400 }
      );
    }

    if (!["diterima", "tidak_lulus"].includes(currentStage)) {
      return NextResponse.json(
        { success: false, error: "currentStage harus 'diterima' atau 'tidak_lulus'" },
        { status: 400 }
      );
    }

    const [applicant] = await db
      .select()
      .from(pmbApplicants)
      .where(eq(pmbApplicants.id, applicantId));

    if (!applicant) {
      return NextResponse.json(
        { success: false, error: "Pendaftar tidak ditemukan" },
        { status: 404 }
      );
    }

    const numericScore = parseFloat(totalExamScore || "0");
    const recommendation = calculatePassingRecommendation(numericScore).recommendation;

    // Update applicant
    const [updated] = await db
      .update(pmbApplicants)
      .set({
        currentStage,
        totalExamScore: String(numericScore),
        passingRecommendation: recommendation,
        updatedAt: new Date(),
      })
      .where(eq(pmbApplicants.id, applicantId))
      .returning();

    // Audit status history
    await db.insert(pmbApplicantStatusHistory).values({
      applicantId,
      fromStage: applicant.currentStage,
      toStage: currentStage,
      changedByStaffId: changedByStaffId || null,
      note: note || `Keputusan kelulusan: ${currentStage.toUpperCase()} (Skor: ${numericScore})`,
    });

    return NextResponse.json({
      success: true,
      message: `Status pendaftar berhasil diperbarui menjadi ${currentStage.toUpperCase()}`,
      applicant: updated,
    });
  } catch (error: any) {
    console.error("[Grade API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui status kelulusan" },
      { status: 500 }
    );
  }
}
