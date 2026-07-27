import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payrollRuns } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payrollRunId } = body;

    if (!payrollRunId) {
      return NextResponse.json(
        { success: false, error: "payrollRunId wajib diisi" },
        { status: 400 }
      );
    }

    const [run] = await db.select().from(payrollRuns).where(eq(payrollRuns.id, payrollRunId));

    if (!run) {
      return NextResponse.json(
        { success: false, error: "Payroll run tidak ditemukan" },
        { status: 404 }
      );
    }

    // Webhook call to Modul Keuangan (SKEU Expenditure API)
    const skeuPayrollUrl = process.env.SKEU_PAYROLL_URL || "http://localhost:3000/api/skeu/expenditure/payroll";

    const payload = {
      period: run.period,
      source: "hris",
      totalGross: String(run.totalGross),
      totalTax: "0",
      totalNet: String(run.totalNet),
      approvedBy: "Warek II & Kabag SDM",
      items: [],
    };

    console.log(`[HRIS Publisher] Sending payroll disbursement payload to SKEU: ${skeuPayrollUrl}...`);

    const res = await fetch(skeuPayrollUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[HRIS Publisher Warning] SKEU status ${res.status}: ${errText}`);
    } else {
      console.log(`[HRIS Publisher Success] Payroll disbursement recorded in SKEU Expenditure!`);
    }

    return NextResponse.json({
      success: true,
      message: `Disbursement payroll periode ${run.period} senilai Rp ${run.totalNet.toLocaleString("id-ID")} berhasil terkirim ke Modul Keuangan!`,
    });
  } catch (error: any) {
    console.error("[Disburse Payroll Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal melakukan disburse payroll ke Keuangan" },
      { status: 500 }
    );
  }
}
