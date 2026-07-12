import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicantDocuments, pmbApplicants, pmbApplicantStatusHistory } from "@/db/schema/applicants";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const evaluations = Array.isArray(body) ? body : [body];

    if (evaluations.length === 0) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    // 1. Validate & Process each document evaluation
    for (const item of evaluations) {
      const { documentId, status, revisionNote } = item;
      if (!documentId || !status) continue;

      if (status === "perlu_revisi" && (!revisionNote || revisionNote.trim() === "")) {
        return NextResponse.json({
          success: false,
          error: "Catatan revisi wajib diisi untuk dokumen yang minta revisi",
        }, { status: 400 });
      }

      await db
        .update(pmbApplicantDocuments)
        .set({
          status,
          revisionNote: status === "perlu_revisi" ? revisionNote.trim() : null,
          verifiedAt: new Date(),
        })
        .where(eq(pmbApplicantDocuments.id, documentId));
    }

    // 2. Evaluate applicant stage using the applicantId of the first item
    const targetApplicantId = evaluations[0].applicantId;
    if (targetApplicantId) {
      const docs = await db
        .select()
        .from(pmbApplicantDocuments)
        .where(eq(pmbApplicantDocuments.applicantId, targetApplicantId));

      const allVerified = docs.every((d) => d.status === "terverifikasi") && docs.length === 4;
      const hasRejections = docs.some((d) => d.status === "perlu_revisi");

      const applicantList = await db
        .select()
        .from(pmbApplicants)
        .where(eq(pmbApplicants.id, targetApplicantId))
        .limit(1);

      const applicant = applicantList[0];
      if (applicant) {
        const fromStage = applicant.currentStage;
        let toStage = fromStage;

        if (allVerified) {
          toStage = "siap_ujian";
        } else if (hasRejections) {
          toStage = "isi_biodata";
        }

        // If transition occurs, record in history and update stage
        if (toStage !== fromStage) {
          await db
            .update(pmbApplicants)
            .set({ currentStage: toStage, updatedAt: new Date() })
            .where(eq(pmbApplicants.id, targetApplicantId));

          await db
            .insert(pmbApplicantStatusHistory)
            .values({
              applicantId: targetApplicantId,
              fromStage,
              toStage,
              note: toStage === "siap_ujian"
                ? "Semua berkas persyaratan lolos verifikasi. Akses CBT dibuka."
                : "Berkas persyaratan memerlukan revisi. Silakan upload ulang.",
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Verifikasi dokumen berhasil disimpan!",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
