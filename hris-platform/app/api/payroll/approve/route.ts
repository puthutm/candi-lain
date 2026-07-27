import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payrollApprovals, payrollRunSteps, payrollRuns } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payrollRunId, approverRole, status, notes, approverName } = body;

    if (!payrollRunId || !approverRole || !status) {
      return NextResponse.json(
        { success: false, error: "payrollRunId, approverRole, dan status wajib diisi" },
        { status: 400 }
      );
    }

    // Update approval record
    const existing = await db
      .select()
      .from(payrollApprovals)
      .where(
        and(
          eq(payrollApprovals.payrollRunId, payrollRunId),
          eq(payrollApprovals.approverRole, approverRole)
        )
      );

    if (existing.length > 0) {
      await db
        .update(payrollApprovals)
        .set({
          status,
          notes: notes || (status === "approved" ? "Disetujui" : "Ditolak"),
          approverName: approverName || existing[0].approverName,
        })
        .where(eq(payrollApprovals.id, existing[0].id));
    } else {
      await db.insert(payrollApprovals).values({
        payrollRunId,
        approverRole,
        approverName: approverName || approverRole,
        status,
        notes,
      });
    }

    // Check if all approvals are completed
    const allApprovals = await db
      .select()
      .from(payrollApprovals)
      .where(eq(payrollApprovals.payrollRunId, payrollRunId));

    const allApproved = allApprovals.length >= 3 && allApprovals.every((a) => a.status === "approved");

    if (allApproved) {
      await db
        .update(payrollRunSteps)
        .set({ status: "selesai", completedAt: new Date() })
        .where(
          and(
            eq(payrollRunSteps.payrollRunId, payrollRunId),
            eq(payrollRunSteps.stepName, "persetujuan")
          )
        );

      await db
        .update(payrollRuns)
        .set({ status: "selesai" })
        .where(eq(payrollRuns.id, payrollRunId));
    }

    return NextResponse.json({
      success: true,
      message: `Persetujuan role '${approverRole}' berhasil dicatat dengan status ${status.toUpperCase()}`,
      allApproved,
    });
  } catch (error: any) {
    console.error("[Payroll Approve API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mencatat persetujuan payroll" },
      { status: 500 }
    );
  }
}
