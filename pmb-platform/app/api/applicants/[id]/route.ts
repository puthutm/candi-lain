import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants, pmbApplicantDocuments, pmbDocumentTypes, pmbApplicantProfiles } from "@/db/schema/applicants";
import { pmbWaves, pmbEntryPaths, pmbStudyPrograms } from "@/db/schema/master";
import { pmbExamResults, pmbExamModules } from "@/db/schema/exam";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// Get details of a single applicant
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const applicantList = await db
      .select({
        id: pmbApplicants.id,
        registrationNumber: pmbApplicants.registrationNumber,
        fullName: pmbApplicants.fullName,
        email: pmbApplicants.email,
        phone: pmbApplicants.phone,
        currentStage: pmbApplicants.currentStage,
        paymentStatus: pmbApplicants.paymentStatus,
        createdAt: pmbApplicants.createdAt,
        updatedAt: pmbApplicants.updatedAt,
        waveId: pmbApplicants.waveId,
        entryPathId: pmbApplicants.entryPathId,
        studyProgramId: pmbApplicants.studyProgramId,
        waveName: pmbWaves.name,
        entryPathName: pmbEntryPaths.name,
        entryPathFee: pmbEntryPaths.formFee,
        studyProgramName: pmbStudyPrograms.name,
        studyProgramFaculty: pmbStudyPrograms.faculty,
      })
      .from(pmbApplicants)
      .leftJoin(pmbWaves, eq(pmbApplicants.waveId, pmbWaves.id))
      .leftJoin(pmbEntryPaths, eq(pmbApplicants.entryPathId, pmbEntryPaths.id))
      .leftJoin(pmbStudyPrograms, eq(pmbApplicants.studyProgramId, pmbStudyPrograms.id))
      .where(eq(pmbApplicants.id, id))
      .limit(1);

    if (applicantList.length === 0) {
      return NextResponse.json({ success: false, error: "Pendaftar tidak ditemukan" }, { status: 404 });
    }

    const applicant = applicantList[0]!;

    const docs = await db
      .select({
        id: pmbApplicantDocuments.id,
        applicantId: pmbApplicantDocuments.applicantId,
        documentTypeId: pmbApplicantDocuments.documentTypeId,
        fileUrl: pmbApplicantDocuments.fileUrl,
        status: pmbApplicantDocuments.status,
        revisionNote: pmbApplicantDocuments.revisionNote,
        uploadedAt: pmbApplicantDocuments.uploadedAt,
        documentTypeName: pmbDocumentTypes.name,
        documentTypeCode: pmbDocumentTypes.code,
      })
      .from(pmbApplicantDocuments)
      .leftJoin(pmbDocumentTypes, eq(pmbApplicantDocuments.documentTypeId, pmbDocumentTypes.id))
      .where(eq(pmbApplicantDocuments.applicantId, id));

    const examResults = await db
      .select({
        id: pmbExamResults.id,
        score: pmbExamResults.score,
        passed: pmbExamResults.passed,
        gradedAt: pmbExamResults.gradedAt,
        moduleName: pmbExamModules.name,
        moduleCode: pmbExamModules.code,
      })
      .from(pmbExamResults)
      .leftJoin(pmbExamModules, eq(pmbExamResults.examModuleId, pmbExamModules.id))
      .where(eq(pmbExamResults.applicantId, id));

    const profileList = await db
      .select()
      .from(pmbApplicantProfiles)
      .where(eq(pmbApplicantProfiles.applicantId, id))
      .limit(1);

    return NextResponse.json({
      success: true,
      applicant,
      documents: docs,
      examResults,
      profile: profileList[0] || null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Update applicant info / stage / payment
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { currentStage, paymentStatus } = body;

    const updated = await db
      .update(pmbApplicants)
      .set({
        ...(currentStage && { currentStage }),
        ...(paymentStatus && { paymentStatus }),
        updatedAt: new Date(),
      })
      .where(eq(pmbApplicants.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ success: false, error: "Gagal memperbarui data pendaftar" }, { status: 404 });
    }

    const appRecord = updated[0]!;

    // Trigger webhook if applicant is accepted AND payment is paid
    if (appRecord.currentStage === "diterima" && appRecord.paymentStatus === "lunas") {
      try {
        const actualDocs = await db
          .select({
            code: pmbDocumentTypes.code,
            fileUrl: pmbApplicantDocuments.fileUrl,
            uploadedAt: pmbApplicantDocuments.uploadedAt,
          })
          .from(pmbApplicantDocuments)
          .leftJoin(pmbDocumentTypes, eq(pmbApplicantDocuments.documentTypeId, pmbDocumentTypes.id))
          .where(eq(pmbApplicantDocuments.applicantId, appRecord.id));

        const documentsSnapshot = actualDocs.map(d => ({
          doc_type: d.code || "unknown",
          file_url: d.fileUrl || "",
          verified_at: d.uploadedAt?.toISOString() || new Date().toISOString(),
        }));

        const eventId = crypto.randomUUID();
        const payload = {
          event: "applicant.accepted_and_paid",
          event_id: eventId,
          occurred_at: new Date().toISOString(),
          data: {
            pmb_applicant_id: appRecord.id,
            registration_number: appRecord.registrationNumber || `PMB-2026-${appRecord.id.slice(0, 6).toUpperCase()}`,
            full_name: appRecord.fullName,
            email: appRecord.email,
            phone: appRecord.phone || "",
            study_program_code: appRecord.studyProgramId || "INF",
            entry_path_code: appRecord.entryPathId || "REGULER",
            documents_snapshot: documentsSnapshot,
          }
        };

        // Fire and forget, log errors if any
        fetch(env.SIAKAD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(err => console.error("Webhook trigger failed", err));
      } catch (webhookErr) {
        console.error("Webhook build failed", webhookErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data pendaftar berhasil diperbarui!",
      applicant: appRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
