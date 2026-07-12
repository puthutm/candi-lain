import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicantDocuments, pmbDocumentTypes, pmbApplicants, pmbApplicantStatusHistory } from "@/db/schema/applicants";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { applicantId, documentCode, fileUrl } = body;

    if (!applicantId || !documentCode || !fileUrl) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    // Get document type
    const docType = await db
      .select()
      .from(pmbDocumentTypes)
      .where(eq(pmbDocumentTypes.code, documentCode))
      .limit(1);

    if (docType.length === 0) {
      return NextResponse.json({ success: false, error: "Jenis dokumen tidak valid" }, { status: 400 });
    }

    const selectedDocType = docType[0]!;

    // Check if doc already uploaded
    const existing = await db
      .select()
      .from(pmbApplicantDocuments)
      .where(
        and(
          eq(pmbApplicantDocuments.applicantId, applicantId),
          eq(pmbApplicantDocuments.documentTypeId, selectedDocType.id)
        )
      )
      .limit(1);

    const existingDoc = existing[0];

    let docRow;
    if (existingDoc) {
      docRow = await db
        .update(pmbApplicantDocuments)
        .set({
          fileUrl,
          status: "menunggu_verifikasi",
          revisionNote: null,
          uploadedAt: new Date(),
        })
        .where(eq(pmbApplicantDocuments.id, existingDoc.id))
        .returning();
    } else {
      docRow = await db
        .insert(pmbApplicantDocuments)
        .values({
          applicantId,
          documentTypeId: selectedDocType.id,
          fileUrl,
          status: "menunggu_verifikasi",
          revisionNote: null,
        })
        .returning();
    }

    // Check if they uploaded all 4 documents. If so, move stage to 'unggah_berkas'
    const allUploaded = await db
      .select()
      .from(pmbApplicantDocuments)
      .where(eq(pmbApplicantDocuments.applicantId, applicantId));

    if (allUploaded.length === 4) {
      const applicantList = await db
        .select()
        .from(pmbApplicants)
        .where(eq(pmbApplicants.id, applicantId))
        .limit(1);

      const applicant = applicantList[0];
      if (applicant && applicant.currentStage !== "unggah_berkas") {
        await db
          .update(pmbApplicants)
          .set({ currentStage: "unggah_berkas", updatedAt: new Date() })
          .where(eq(pmbApplicants.id, applicantId));

        await db
          .insert(pmbApplicantStatusHistory)
          .values({
            applicantId,
            fromStage: applicant.currentStage,
            toStage: "unggah_berkas",
            note: "Semua 4 dokumen persyaratan wajib telah diunggah. Menunggu verifikasi.",
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Dokumen berhasil diunggah!",
      document: docRow[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
