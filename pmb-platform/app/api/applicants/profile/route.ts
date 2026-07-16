import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants, pmbApplicantProfiles } from "@/db/schema/applicants";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { applicantId, nik, birthPlace, birthDate, gender, address, parentName } = body;

    if (!applicantId || !nik || !birthPlace || !birthDate || !gender || !address || !parentName) {
      return NextResponse.json({ success: false, error: "Semua kolom biodata wajib diisi" }, { status: 400 });
    }

    if (gender !== "L" && gender !== "P") {
      return NextResponse.json({ success: false, error: "Jenis kelamin tidak valid" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // 1. Check if profile already exists
      const existing = await tx
        .select()
        .from(pmbApplicantProfiles)
        .where(eq(pmbApplicantProfiles.applicantId, applicantId))
        .limit(1);

      let profileRecord;

      if (existing.length > 0) {
        // Update profile
        const [updated] = await tx
          .update(pmbApplicantProfiles)
          .set({
            nik,
            birthPlace,
            birthDate,
            gender,
            address,
            parentName,
            updatedAt: new Date(),
          })
          .where(eq(pmbApplicantProfiles.applicantId, applicantId))
          .returning();
        profileRecord = updated;
      } else {
        // Insert new profile
        const [inserted] = await tx
          .insert(pmbApplicantProfiles)
          .values({
            applicantId,
            nik,
            birthPlace,
            birthDate,
            gender,
            address,
            parentName,
          })
          .returning();
        profileRecord = inserted;
      }

      // 2. Fetch current applicant stage
      const applicantList = await tx
        .select()
        .from(pmbApplicants)
        .where(eq(pmbApplicants.id, applicantId))
        .limit(1);

      const applicant = applicantList[0];
      if (applicant) {
        // If current stage is peminat/pendaftar/isi_biodata, upgrade it to unggah_berkas
        const stagesToProgress = ["peminat", "pendaftar", "isi_biodata"];
        if (stagesToProgress.includes(applicant.currentStage)) {
          await tx
            .update(pmbApplicants)
            .set({
              currentStage: "unggah_berkas",
              updatedAt: new Date(),
            })
            .where(eq(pmbApplicants.id, applicantId));
        }
      }

      return profileRecord;
    });

    return NextResponse.json({
      success: true,
      message: "Biodata berhasil disimpan!",
      profile: result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
