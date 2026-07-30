import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants } from "@/db/schema/applicants";
import { eq } from "drizzle-orm";
import { provisionStudentSsoAndSiakad } from "@/lib/sso-provisioner";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicantId, currentStage, paymentStatus, totalExamScore } = body;

    if (!applicantId) {
      return NextResponse.json({ success: false, error: "applicantId wajib diisi" }, { status: 400 });
    }

    const [app] = await db.select().from(pmbApplicants).where(eq(pmbApplicants.id, applicantId));
    if (!app) {
      return NextResponse.json({ success: false, error: "Pendaftar tidak ditemukan" }, { status: 404 });
    }

    const updateFields: any = { updatedAt: new Date() };
    if (currentStage) updateFields.currentStage = currentStage;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;
    if (totalExamScore !== undefined) updateFields.totalExamScore = totalExamScore;

    const isLunas = (paymentStatus || app.paymentStatus) === "lunas";
    const isDiterima = (currentStage || app.currentStage) === "diterima";
    let generatedNim = app.nim;
    let ssoMessage = "";

    // NIM & SSO Account are ONLY generated AFTER UKT/Payment is LUNAS and stage is DITERIMA
    if (isLunas && isDiterima && !app.nim) {
      generatedNim = `260${Math.floor(10000 + Math.random() * 90000)}`;
      updateFields.nim = generatedNim;
      updateFields.nimGeneratedAt = new Date();

      // Provision SSO Student Account & Sync to SIAKAD
      await provisionStudentSsoAndSiakad({
        nim: generatedNim,
        email: app.email,
        fullName: app.fullName,
        phone: app.phone,
      });

      ssoMessage = ` NIM ${generatedNim} diterbitkan & Akun SSO Mahasiswa aktif! (Username: ${generatedNim}, Pass: Mahasiswa2026!)`;
    }

    const [updated] = await db
      .update(pmbApplicants)
      .set(updateFields)
      .where(eq(pmbApplicants.id, applicantId))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Status pendaftar berhasil diperbarui!${ssoMessage}`,
      applicant: updated,
      nim: generatedNim,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
