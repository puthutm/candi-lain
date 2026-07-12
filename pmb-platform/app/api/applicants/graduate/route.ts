import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants, pmbApplicantProfiles, pmbApplicantStatusHistory } from "@/db/schema/applicants";
import { pmbStudyPrograms, pmbEntryPaths } from "@/db/schema/master";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
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

      // 3. Log to history
      await tx
        .insert(pmbApplicantStatusHistory)
        .values({
          applicantId,
          fromStage,
          toStage,
          note: status === "lulus"
            ? "Kandidat dinyatakan Lulus Seleksi PMB."
            : "Kandidat dinyatakan Tidak Lulus Seleksi PMB.",
        });

      return { applicant, toStage };
    });

    const { applicant, toStage: finalStage } = result;

    // 4. Trigger Integration event if Accepted (lulus) and Payment is completed (lunas)
    if (finalStage === "diterima" && applicant.paymentStatus === "lunas") {
      try {
        const payload = {
          pmb_applicant_id: applicant.id,
          registrationNumber: applicant.registrationNumber,
          fullName: applicant.fullName,
          email: applicant.email,
          phone: applicant.phone,
          birthPlace: applicant.birthPlace || "Jakarta",
          birthDate: applicant.birthDate || "2007-01-01",
          gender: applicant.gender || "L",
          address: applicant.address || "Jl. Raya",
          studyProgramCode: applicant.studyProgramCode,
          entryPath: applicant.entryPathCode === "BEAS" ? "beasiswa" : "mandiri",
        };

        const siakadCallbackUrl = "http://localhost:3003/api/integration/pmb-callback";
        
        // Non-blocking fire-and-forget or await the callback
        const response = await fetch(siakadCallbackUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const callbackRes = await response.json();
        if (!callbackRes.success) {
          console.error("SIAKAD integration callback failed:", callbackRes.error);
        }
      } catch (err: any) {
        console.error("Failed to connect to SIAKAD integration callback:", err.message);
      }
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
