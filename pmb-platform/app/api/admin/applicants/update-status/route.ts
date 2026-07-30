import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants } from "@/db/schema/applicants";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicantId, currentStage, paymentStatus } = body;

    if (!applicantId) {
      return NextResponse.json({ success: false, error: "applicantId wajib diisi" }, { status: 400 });
    }

    const updateFields: any = { updatedAt: new Date() };
    if (currentStage) updateFields.currentStage = currentStage;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;

    // Auto generate NIM if status changed to diterima and NIM is null
    if (currentStage === "diterima") {
      const [app] = await db.select().from(pmbApplicants).where(eq(pmbApplicants.id, applicantId));
      if (app && !app.nim) {
        updateFields.nim = `26${Math.floor(100000 + Math.random() * 900000)}`;
        updateFields.nimGeneratedAt = new Date();
      }
    }

    const [updated] = await db
      .update(pmbApplicants)
      .set(updateFields)
      .where(eq(pmbApplicants.id, applicantId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Status pendaftar berhasil diperbarui!",
      applicant: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
