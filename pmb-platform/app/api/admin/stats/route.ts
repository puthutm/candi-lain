import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants } from "@/db/schema/applicants";
import { pmbWaves, pmbStudyPrograms, pmbQuotas } from "@/db/schema/master";
import { pmbExamSessions } from "@/db/schema/exam";
import { pmbInvoices } from "@/db/schema/payment";
import { sql, eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const waveId = searchParams.get("waveId");

    // Build base conditions for wave filtering
    const waveCondition = waveId ? sql`${pmbApplicants.waveId} = ${waveId}` : sql`1=1`;

    // 1. Count per stage (with optional wave filter)
    const stageCounts = await db
      .select({
        currentStage: pmbApplicants.currentStage,
        count: sql<number>`count(*)::int`,
      })
      .from(pmbApplicants)
      .where(waveCondition)
      .groupBy(pmbApplicants.currentStage);

    const stageMap: Record<string, number> = {};
    for (const s of stageCounts) {
      stageMap[s.currentStage] = s.count;
    }

    // 2. Total applicants
    const totalPendaftar = Object.values(stageMap).reduce((a, b) => a + b, 0);

    // 3. Quota utilization per program (with optional wave filter)
    const quotaWhere = waveId ? sql`${pmbQuotas.waveId} = ${waveId}` : sql`1=1`;
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
      .innerJoin(pmbStudyPrograms, eq(pmbQuotas.studyProgramId, pmbStudyPrograms.id))
      .where(quotaWhere);

    // 4. Payment summary (with optional wave filter)
    const paidRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pmbApplicants)
      .where(sql`${pmbApplicants.paymentStatus} = 'lunas' AND ${waveCondition}`);
    const paidCount = paidRows[0]?.count || 0;

    const unpaidRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pmbApplicants)
      .where(sql`${pmbApplicants.paymentStatus} = 'belum_bayar' AND ${waveCondition}`);
    const unpaidCount = unpaidRows[0]?.count || 0;

    // Revenue from invoices (paid) — with wave filter via pmbInvoices
    const revenueWhere = waveId
      ? sql`${pmbInvoices.status} = 'paid' AND ${pmbInvoices.applicantId} IN (SELECT id FROM pmb_applicants WHERE wave_id = ${waveId})`
      : sql`${pmbInvoices.status} = 'paid'`;
    
    const revenueRows = await db
      .select({ total: sql<number>`COALESCE(sum(amount), 0)::int` })
      .from(pmbInvoices)
      .where(revenueWhere);
    const revenueTotal = revenueRows[0]?.total || 0;

    // 5. Acceptance rate
    const diterimaCounts = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pmbApplicants)
      .where(sql`${pmbApplicants.currentStage} = 'diterima' AND ${waveCondition}`);
    const diterima = diterimaCounts[0]?.count || 0;

    const tidakLulusCounts = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pmbApplicants)
      .where(sql`${pmbApplicants.currentStage} = 'tidak_lulus' AND ${waveCondition}`);
    const tidakLulus = tidakLulusCounts[0]?.count || 0;

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

    // 7. Drop-off insight: calculate conversion rate between stages
    const stageOrder: string[] = ["peminat", "pendaftar", "isi_biodata", "unggah_berkas", "siap_ujian", "sedang_ujian", "selesai_ujian", "diterima", "tidak_lulus"];
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
    const dropOffInsights: { fromStage: string; toStage: string; fromLabel: string; toLabel: string; fromCount: number; toCount: number; dropOffRate: number; dropOffCount: number }[] = [];
    for (let i = 0; i < stageOrder.length - 1; i++) {
      const from: string = stageOrder[i] as string;
      const to: string = stageOrder[i + 1] as string;
      const fromCount: number = stageMap[from] || 0;
      const toCount: number = stageMap[to] || 0;
      if (fromCount > 0) {
        const dropOffCount: number = fromCount - toCount;
        const dropOffRate: number = Math.round((dropOffCount / fromCount) * 100);
        dropOffInsights.push({
          fromStage: from,
          toStage: to,
          fromLabel: stageLabels[from] || from,
          toLabel: stageLabels[to] || to,
          fromCount,
          toCount,
          dropOffCount,
          dropOffRate,
        });
      }
    }

    // 8. Get available waves for filter dropdown
    const waves = await db
      .select({ id: pmbWaves.id, name: pmbWaves.name, code: pmbWaves.code, status: pmbWaves.status, startDate: pmbWaves.startDate, endDate: pmbWaves.endDate })
      .from(pmbWaves)
      .orderBy(pmbWaves.createdAt);

    return NextResponse.json({
      success: true,
      stats: {
        totalPendaftar,
        perluVerifikasi: stageMap["unggah_berkas"] || 0,
        lulusSeleksi: diterima,
        tidakLulus,
        revenueTotal,
        paidCount,
        unpaidCount,
        stages: stageMap,
        quotaUtilization: quotas.map((q: any) => ({
          ...q,
          percentage: q.quotaTotal > 0 ? Math.round((q.quotaFilled / q.quotaTotal) * 100) : 0,
        })),
        examCompletion: examMap,
        dropOffInsights,
        waves,
        activeWaveId: waveId || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
