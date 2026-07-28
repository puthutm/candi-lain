import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicantDocuments, pmbDocumentTypes, pmbApplicants, pmbApplicantStatusHistory } from "@/db/schema/applicants";
import { eq, and } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const applicantId = formData.get("applicantId") as string;
    const documentCode = formData.get("documentCode") as string;
    const file = formData.get("file") as File | null;

    if (!applicantId || !documentCode || !file) {
      return NextResponse.json({ success: false, error: "applicantId, documentCode, dan file wajib diisi" }, { status: 400 });
    }

    // Save file to /public/uploads/documents/<applicantId>/
    const uploadDir = join(process.cwd(), "public", "uploads", "documents", applicantId);
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop() || "bin";
    const filename = `${documentCode.toLowerCase()}_${Date.now()}.${ext}`;
    const filePath = join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/documents/${applicantId}/${filename}`;

    // Upsert document record in DB
    const docType = await db
      .select()
      .from(pmbDocumentTypes)
      .where(eq(pmbDocumentTypes.code, documentCode))
      .limit(1);

    if (docType.length === 0) {
      // If no docType found, still succeed but just store the file URL
      return NextResponse.json({
        success: true,
        fileUrl,
        message: `File ${documentCode} berhasil diunggah`,
      });
    }

    const selectedDocType = docType[0]!;

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

    if (existing[0]) {
      await db
        .update(pmbApplicantDocuments)
        .set({ fileUrl, status: "menunggu_verifikasi", revisionNote: null, uploadedAt: new Date() })
        .where(eq(pmbApplicantDocuments.id, existing[0].id));
    } else {
      await db
        .insert(pmbApplicantDocuments)
        .values({ applicantId, documentTypeId: selectedDocType.id, fileUrl, status: "menunggu_verifikasi" });
    }

    // Check if 4 required documents uploaded → advance stage
    const allUploaded = await db
      .select()
      .from(pmbApplicantDocuments)
      .where(eq(pmbApplicantDocuments.applicantId, applicantId));

    if (allUploaded.length >= 4) {
      const applicantList = await db
        .select()
        .from(pmbApplicants)
        .where(eq(pmbApplicants.id, applicantId))
        .limit(1);

      const applicant = applicantList[0];
      if (applicant && applicant.currentStage !== "unggah_berkas" && applicant.currentStage !== "siap_ujian" && applicant.currentStage !== "diterima") {
        await db.update(pmbApplicants)
          .set({ currentStage: "unggah_berkas", updatedAt: new Date() })
          .where(eq(pmbApplicants.id, applicantId));

        await db.insert(pmbApplicantStatusHistory).values({
          applicantId,
          fromStage: applicant.currentStage,
          toStage: "unggah_berkas",
          note: "Dokumen wajib berhasil diunggah. Menunggu verifikasi admin.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      message: `${documentCode} berhasil diunggah!`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
