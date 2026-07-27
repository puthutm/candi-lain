import { NextRequest, NextResponse } from "next/server";
import { processPayrollRun } from "@/lib/payroll-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { period, cutoffDate, disburseTargetDate } = body;

    if (!period) {
      return NextResponse.json(
        { success: false, error: "Periode payroll (misal: '2026-07') wajib diisi" },
        { status: 400 }
      );
    }

    const cutoff = cutoffDate || new Date().toISOString().split("T")[0];
    const targetDate = disburseTargetDate || new Date().toISOString().split("T")[0];

    const result = await processPayrollRun(period, cutoff, targetDate);

    return NextResponse.json({
      success: true,
      message: `Payroll Run periode ${period} berhasil di-inisiasi (Tahap 1 - 3 Selesai)! Total Net: Rp ${result.totalNet.toLocaleString("id-ID")}`,
      result,
    });
  } catch (error: any) {
    console.error("[Payroll Run API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menjalankan Payroll Run" },
      { status: 500 }
    );
  }
}
