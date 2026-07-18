import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants, pmbApplicantStatusHistory } from "@/db/schema/applicants";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { applicantId, reason } = body;

    if (!applicantId) {
      return NextResponse.json({ success: false, error: "Missing applicantId" }, { status: 400 });
    }

    const [applicant] = await db
      .select()
      .from(pmbApplicants)
      .where(eq(pmbApplicants.id, applicantId))
      .limit(1);

    if (!applicant) {
      return NextResponse.json({ success: false, error: "Applicant not found" }, { status: 404 });
    }

    // Log the violation in pmbApplicantStatusHistory so it's visible in the admin candidate logs
    await db.insert(pmbApplicantStatusHistory).values({
      applicantId: applicant.id,
      fromStage: applicant.currentStage,
      toStage: applicant.currentStage,
      note: `[PELANGGARAN UJIAN] Sesi ujian terdeteksi keluar dari fokus tab browser. Detail: ${reason || "Pindah Tab Browser"}`
    });

    return NextResponse.json({ success: true, message: "Violation logged successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
