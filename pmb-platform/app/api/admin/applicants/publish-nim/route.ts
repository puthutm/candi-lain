import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants, pmbApplicantProfiles, pmbStudyPrograms, pmbEntryPaths } from "@/db/schema";
import { eq, isNotNull, count } from "drizzle-orm";
import { generateStudentNim } from "@/lib/nim-generator";
import { publishAcceptedApplicantToSiakad } from "@/lib/siakad-publisher";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicantId } = body;

    if (!applicantId) {
      return NextResponse.json(
        { success: false, error: "applicantId wajib diisi" },
        { status: 400 }
      );
    }

    // Fetch applicant with prodi & entry path details
    const [applicant] = await db
      .select({
        id: pmbApplicants.id,
        fullName: pmbApplicants.fullName,
        email: pmbApplicants.email,
        phone: pmbApplicants.phone,
        currentStage: pmbApplicants.currentStage,
        studyProgramId: pmbApplicants.studyProgramId,
        entryPathId: pmbApplicants.entryPathId,
        nim: pmbApplicants.nim,
        studyProgramCode: pmbStudyPrograms.code,
        entryPathCode: pmbEntryPaths.code,
      })
      .from(pmbApplicants)
      .leftJoin(pmbStudyPrograms, eq(pmbApplicants.studyProgramId, pmbStudyPrograms.id))
      .leftJoin(pmbEntryPaths, eq(pmbApplicants.entryPathId, pmbEntryPaths.id))
      .where(eq(pmbApplicants.id, applicantId));

    if (!applicant) {
      return NextResponse.json(
        { success: false, error: "Pendaftar tidak ditemukan" },
        { status: 404 }
      );
    }

    if (applicant.currentStage !== "diterima") {
      return NextResponse.json(
        { success: false, error: "Penerbitan NIM hanya dapat dilakukan untuk pendaftar berstatus 'diterima'" },
        { status: 400 }
      );
    }

    let finalNim = applicant.nim;

    // Generate new NIM if not present
    if (!finalNim) {
      const countRes = await db
        .select({ value: count() })
        .from(pmbApplicants)
        .where(isNotNull(pmbApplicants.nim));

      const nextSeq = (countRes[0]?.value || 0) + 1;
      const prodiCode = applicant.studyProgramCode || "301";
      const pathCode = applicant.entryPathCode || "01";

      finalNim = generateStudentNim(prodiCode, pathCode, nextSeq);

      await db
        .update(pmbApplicants)
        .set({
          nim: finalNim,
          nimGeneratedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(pmbApplicants.id, applicantId));
    }

    // Fetch optional NIK from profile
    const [profile] = await db
      .select({ nik: pmbApplicantProfiles.nik })
      .from(pmbApplicantProfiles)
      .where(eq(pmbApplicantProfiles.applicantId, applicantId));

    // Publish event to SIAKAD
    const siakadResult = await publishAcceptedApplicantToSiakad({
      pmbApplicantId: applicant.id,
      fullName: applicant.fullName,
      nik: profile?.nik,
      email: applicant.email,
      phone: applicant.phone,
      studyProgramId: applicant.studyProgramId,
      acceptedDate: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `NIM ${finalNim} berhasil diterbitkan dan disinkronkan ke SIAKAD!`,
      nim: finalNim,
      siakadSync: siakadResult,
    });
  } catch (error: any) {
    console.error("[Publish NIM Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menerbitkan NIM" },
      { status: 500 }
    );
  }
}
