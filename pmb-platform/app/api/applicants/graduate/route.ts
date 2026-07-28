import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants, pmbApplicantProfiles, pmbApplicantStatusHistory } from "@/db/schema/applicants";
import { pmbStudyPrograms, pmbEntryPaths } from "@/db/schema/master";
import { pmbExamResults } from "@/db/schema/exam";
import { eq } from "drizzle-orm";
import { getStaffId, requireRole, FULL_ACCESS_ROLES } from "@/lib/sso-middleware";
import { publishAcceptedApplicantToSiakad } from "@/lib/siakad-publisher";

export async function POST(req: Request) {
  try {
    // RBAC: Admin roles can make graduation decisions
    const auth = await requireRole(FULL_ACCESS_ROLES);
    if (auth instanceof NextResponse) return auth;

    const staffId = await getStaffId();
    const body = await req.json();
    const { applicantId, status } = body; // status can be "lulus" or "tidak_lulus"

    if (!applicantId || !status) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    if (status !== "lulus" && status !== "tidak_lulus") {
      return NextResponse.json({ success: false, error: "Status kelulusan tidak valid" }, { status: 400 });
    }

    const toStage = status === "lulus" ? "diterima" : "tidak_lulus";

    const result = await db.transaction(async (tx) => {
      // 1. Get applicant with profile and program/entry path details
      const applicantList = await tx
        .select({
          id: pmbApplicants.id,
          registrationNumber: pmbApplicants.registrationNumber,
          fullName: pmbApplicants.fullName,
          email: pmbApplicants.email,
          phone: pmbApplicants.phone,
          paymentStatus: pmbApplicants.paymentStatus,
          currentStage: pmbApplicants.currentStage,
          studyProgramCode: pmbStudyPrograms.code,
          entryPathCode: pmbEntryPaths.code,
          nik: pmbApplicantProfiles.nik,
          birthPlace: pmbApplicantProfiles.birthPlace,
          birthDate: pmbApplicantProfiles.birthDate,
          gender: pmbApplicantProfiles.gender,
          address: pmbApplicantProfiles.address,
        })
        .from(pmbApplicants)
        .leftJoin(pmbStudyPrograms, eq(pmbApplicants.studyProgramId, pmbStudyPrograms.id))
        .leftJoin(pmbEntryPaths, eq(pmbApplicants.entryPathId, pmbEntryPaths.id))
        .leftJoin(pmbApplicantProfiles, eq(pmbApplicants.id, pmbApplicantProfiles.applicantId))
        .where(eq(pmbApplicants.id, applicantId))
        .limit(1);

      if (applicantList.length === 0) {
        throw new Error("Kandidat pendaftar tidak ditemukan");
      }

      const applicant = applicantList[0]!;
      const fromStage = applicant.currentStage;

      // 2. Update currentStage in database
      await tx
        .update(pmbApplicants)
        .set({ currentStage: toStage, updatedAt: new Date() })
        .where(eq(pmbApplicants.id, applicantId));

      // 3. Log to history with staff ID
      await tx
        .insert(pmbApplicantStatusHistory)
        .values({
          applicantId,
          fromStage,
          toStage,
          changedByStaffId: staffId,
          note: status === "lulus"
            ? "Kandidat dinyatakan Lulus Seleksi PMB."
            : "Kandidat dinyatakan Tidak Lulus Seleksi PMB.",
        });

      // 4. Update exam results with gradedByStaffId if applicable
      if (toStage === "diterima" || toStage === "tidak_lulus") {
        await tx
          .update(pmbExamResults)
          .set({
            gradedByStaffId: staffId,
            gradedAt: new Date(),
          })
          .where(eq(pmbExamResults.applicantId, applicantId));
      }

      return { applicant, toStage };
    });

    const { applicant, toStage: finalStage } = result;

    // 5. Trigger Integration event if Accepted (lulus)
    if (finalStage === "diterima") {
      await publishAcceptedApplicantToSiakad({
        pmbApplicantId: applicant.id,
        fullName: applicant.fullName,
        nik: applicant.nik || undefined,
        email: applicant.email,
        phone: applicant.phone || undefined,
        studyProgramId: applicant.studyProgramCode || "00000000-0000-0000-0000-000000000001",
        acceptedDate: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Keputusan kelulusan berhasil disimpan: ${status === "lulus" ? "Diterima" : "Tidak Lulus"}!`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
