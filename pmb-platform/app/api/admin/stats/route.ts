import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants } from "@/db/schema/applicants";
import { pmbWaves, pmbStudyPrograms, pmbQuotas } from "@/db/schema/master";
import { pmbExamResults, pmbExamSessions } from "@/db/schema/exam";
import { pmbInvoices } from "@/db/schema/payment";
import { sql, eq } from "drizzle-orm";

export async function GET() {
  try {
    // 1. Count per stage
    const stageCounts = await db
      .select({
        currentStage: pmbApplicants.currentStage,
        count: sql<number>`count(*)::int`,
      })
      .from(pmbApplicants)
      .groupBy(pmbApplicants.currentStage);

    const stageMap: Record<string, number> = {};
    for (const s of stageCounts) {
      stageMap[s.currentStage] = s.count;
    }

    // 2. Total applicants
    const totalPendaftar = Object.values(stageMap).reduce((a, b) => a + b, 0);

    // 3. Quota utilization per program
    const quotas = await db
      .select({
        waveId: pmbQuotas.waveId,
        studyProgramId: pmbQuotas.studyProgramId,
        quotaTotal: pmbQuotas.quotaTotal,
        quotaFilled: pmbQuotas.quotaFilled,
        prodiName: pmbStudyPrograms.name,
        prodiCode: pmbStudyPrograms.code,
      })
      .from(pmbQuotas)
      .innerJoin(pmbStudyPrograms, eq(pmbQuotas.studyProgramId, pmbStudyPrograms.id));

    // 4. Payment summary
    const paidCount = stageMap["lunas"] || 0;
    const unpaidCount = (stageMap["belum_bayar"] || 0);

    // Revenue from invoices (paid)
    const revenueRows = await db
      .select({ total: sql<number>`sum(amount)::int` })
      .from(pmbInvoices)
      .where(eq(pmbInvoices.status, "paid"));
    const revenueTotal = revenueRows[0]?.total || 0;

    // 5. Acceptance rate
    const diterima = stageMap["diterima"] || 0;
    const tidakLulus = stageMap["tidak_lulus"] || 0;
    const selesaiUjian = stageMap["selesai_ujian"] || 0;

    // 6. Exam completion
    const examSessions = await db
      .select({
        status: pmbExamSessions.status,
        count: sql<number>`count(*)::int`,
      })
      .from(pmbExamSessions)
      .groupBy(pmbExamSessions.status);
    const examMap: Record<string, number> = {};
    for (const e of examSessions) examMap[e.status] = e.count;

    return NextResponse.json({
      success: true,
      stats: {
        totalPendaftar,
        perluVerifikasi: stageMap["unggah_berkas"] || 0,
        lulusSeleksi: diterima,
        tidakLulus,
        selesaiUjian,
        revenueTotal,
        paidCount,
        unpaidCount,
        stages: stageMap,
        quotaUtilization: quotas.map((q) => ({
          ...q,
          percentage: q.quotaTotal > 0 ? Math.round((q.quotaFilled / q.quotaTotal) * 100) : 0,
        })),
        examCompletion: examMap,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
