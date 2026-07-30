import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants } from "@/db/schema/applicants";
import { pmbWaves, pmbEntryPaths, pmbStudyPrograms, pmbQuotas } from "@/db/schema/master";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    // 1. Fetch all applicants with joined wave, entryPath, studyProgram
    const rawApplicants = await db
      .select({
        id: pmbApplicants.id,
        registrationNumber: pmbApplicants.registrationNumber,
        fullName: pmbApplicants.fullName,
        email: pmbApplicants.email,
        phone: pmbApplicants.phone,
        currentStage: pmbApplicants.currentStage,
        paymentStatus: pmbApplicants.paymentStatus,
        createdAt: pmbApplicants.createdAt,
        nim: pmbApplicants.nim,
        nimGeneratedAt: pmbApplicants.nimGeneratedAt,
        totalExamScore: pmbApplicants.totalExamScore,
        passingRecommendation: pmbApplicants.passingRecommendation,
        waveName: pmbWaves.name,
        entryPathName: pmbEntryPaths.name,
        entryPathFee: pmbEntryPaths.formFee,
        studyProgramName: pmbStudyPrograms.name,
      })
      .from(pmbApplicants)
      .leftJoin(pmbWaves, eq(pmbApplicants.waveId, pmbWaves.id))
      .leftJoin(pmbEntryPaths, eq(pmbApplicants.entryPathId, pmbEntryPaths.id))
      .leftJoin(pmbStudyPrograms, eq(pmbApplicants.studyProgramId, pmbStudyPrograms.id))
      .orderBy(desc(pmbApplicants.createdAt));

    const applicants = rawApplicants.map((a) => ({
      id: a.id,
      registrationNumber: a.registrationNumber,
      fullName: a.fullName,
      email: a.email,
      phone: a.phone,
      currentStage: a.currentStage,
      paymentStatus: a.paymentStatus,
      createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
      wave: a.waveName || "-",
      entryPath: a.entryPathName || "-",
      entryPathFee: a.entryPathFee ? String(a.entryPathFee) : "0",
      studyProgram: a.studyProgramName || "-",
      docsCount: 0,
      nim: a.nim || undefined,
      nimGeneratedAt: a.nimGeneratedAt ? new Date(a.nimGeneratedAt).toISOString() : undefined,
      totalExamScore: a.totalExamScore || undefined,
      passingRecommendation: a.passingRecommendation || undefined,
    }));

    // 2. Fetch all waves
    const rawWaves = await db.select().from(pmbWaves).orderBy(desc(pmbWaves.createdAt));
    const waves = rawWaves.map((w) => ({
      id: w.id,
      name: w.name,
      code: w.code,
      academicPeriodLabel: w.academicPeriodLabel || "2026/2027 Ganjil",
      defaultPassword: w.defaultPassword,
      startDate: w.startDate,
      endDate: w.endDate,
      status: w.status,
    }));

    // 3. Fetch quotas
    const rawQuotas = await db
      .select({
        id: pmbQuotas.id,
        waveId: pmbQuotas.waveId,
        studyProgramId: pmbQuotas.studyProgramId,
        quotaTotal: pmbQuotas.quotaTotal,
        quotaFilled: pmbQuotas.quotaFilled,
        waveName: pmbWaves.name,
        prodiName: pmbStudyPrograms.name,
        prodiCode: pmbStudyPrograms.code,
      })
      .from(pmbQuotas)
      .leftJoin(pmbWaves, eq(pmbQuotas.waveId, pmbWaves.id))
      .leftJoin(pmbStudyPrograms, eq(pmbQuotas.studyProgramId, pmbStudyPrograms.id));

    const quotas = rawQuotas.map((q) => ({
      id: q.id,
      waveId: q.waveId,
      studyProgramId: q.studyProgramId,
      quotaTotal: q.quotaTotal,
      quotaFilled: q.quotaFilled,
      waveName: q.waveName || "-",
      prodiName: q.prodiName || "-",
      prodiCode: q.prodiCode || "-",
      percentage: q.quotaTotal > 0 ? Math.round((q.quotaFilled / q.quotaTotal) * 100) : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        applicants,
        waves,
        quotas,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
