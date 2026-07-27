import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicantStatusHistory } from "@/db/schema/applicants";
import { eq, desc } from "drizzle-orm";
import { requireRole, PMB_ROLES } from "@/lib/sso-middleware";

/**
 * GET /api/applicants/audit?applicantId=xxx
 * Returns the full audit trail for a specific applicant.
 * Accessible by: Super Admin, Verifikator, Staff Keuangan
 */
export async function GET(req: Request) {
  try {
    // RBAC: All admin roles can view audit trail
    const auth = await requireRole([
      PMB_ROLES.SUPER_ADMIN,
      PMB_ROLES.VERIFIKATOR,
      PMB_ROLES.STAFF_KEUANGAN,
      PMB_ROLES.STAFF_MARKETING,
    ]);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const applicantId = searchParams.get("applicantId");

    if (!applicantId) {
      return NextResponse.json(
        { success: false, error: "Parameter applicantId wajib diisi" },
        { status: 400 }
      );
    }

    // Fetch audit trail ordered by most recent first
    const history = await db
      .select({
        id: pmbApplicantStatusHistory.id,
        applicantId: pmbApplicantStatusHistory.applicantId,
        fromStage: pmbApplicantStatusHistory.fromStage,
        toStage: pmbApplicantStatusHistory.toStage,
        changedByStaffId: pmbApplicantStatusHistory.changedByStaffId,
        note: pmbApplicantStatusHistory.note,
        changedAt: pmbApplicantStatusHistory.changedAt,
      })
      .from(pmbApplicantStatusHistory)
      .where(eq(pmbApplicantStatusHistory.applicantId, applicantId))
      .orderBy(desc(pmbApplicantStatusHistory.changedAt));

    // Format stage labels for readability
    const stageLabels: Record<string, string> = {
      peminat: "Peminat (Leads)",
      pendaftar: "Pendaftar",
      isi_biodata: "Isi Biodata",
      unggah_berkas: "Unggah Berkas",
      siap_ujian: "Siap Ujian (CBT)",
      sedang_ujian: "Sedang Ujian",
      selesai_ujian: "Selesai Ujian",
      diterima: "Diterima (Lolos)",
      tidak_lulus: "Tidak Lulus",
    };

    const formattedHistory = history.map((entry) => ({
      ...entry,
      fromStageLabel: stageLabels[entry.fromStage] || entry.fromStage,
      toStageLabel: stageLabels[entry.toStage] || entry.toStage,
      isSystemAction: !entry.changedByStaffId,
    }));

    return NextResponse.json({
      success: true,
      auditTrail: formattedHistory,
      total: formattedHistory.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
