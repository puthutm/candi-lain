import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants } from "@/db/schema/applicants";
import { pmbExamResults, pmbExamModules } from "@/db/schema/exam";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch applicant
    const applicantList = await db
      .select()
      .from(pmbApplicants)
      .where(eq(pmbApplicants.id, id))
      .limit(1);

    const applicant = applicantList[0];
    if (!applicant) {
      return NextResponse.json({ success: false, error: "Applicant not found" }, { status: 404 });
    }

    // Fetch exam results with module info
    const results = await db
      .select({
        resultId: pmbExamResults.id,
        moduleId: pmbExamResults.examModuleId,
        score: pmbExamResults.score,
        passed: pmbExamResults.passed,
        gradedAt: pmbExamResults.gradedAt,
        moduleName: pmbExamModules.name,
        moduleCode: pmbExamModules.code,
      })
      .from(pmbExamResults)
      .innerJoin(pmbExamModules, eq(pmbExamResults.examModuleId, pmbExamModules.id))
      .where(eq(pmbExamResults.applicantId, id));

    // Calculate overall average
    const scores = results.map((r) => parseFloat(String(r.score)));
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const allPassed = results.length > 0 && results.every((r) => r.passed);
    const hasResults = results.length > 0;

    // Determine admission status
    let status: "menunggu" | "lulus" | "tidak_lulus";
    if (applicant.currentStage === "diterima") {
      status = "lulus";
    } else if (applicant.currentStage === "tidak_lulus") {
      status = "tidak_lulus";
    } else if (hasResults && !allPassed) {
      status = "tidak_lulus";
    } else if (hasResults) {
      status = "menunggu"; // results exist but admin hasn't confirmed yet
    } else {
      status = "menunggu";
    }

    return NextResponse.json({
      success: true,
      applicant: {
        id: applicant.id,
        fullName: applicant.fullName,
        registrationNumber: applicant.registrationNumber,
        currentStage: applicant.currentStage,
        studyProgramId: applicant.studyProgramId,
      },
      results,
      summary: {
        totalModules: results.length,
        averageScore: averageScore.toFixed(2),
        allPassed,
        status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
