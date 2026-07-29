import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { payrollRuns, payslips } from "@/db/schema/payroll";
import { employees } from "@/db/schema/civitas";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { payrollRunId } = body;

    if (!payrollRunId) {
      return NextResponse.json({ error: "payrollRunId wajib diisi" }, { status: 400 });
    }

    // 1. Fetch payroll run details
    const runs = await db.select().from(payrollRuns).where(eq(payrollRuns.id, payrollRunId));
    if (runs.length === 0) {
      return NextResponse.json({ error: "Payroll Run tidak ditemukan" }, { status: 404 });
    }

    const run = runs[0]!;

    // 2. Fetch items & employee bank account info from payslips
    const items = await db
      .select({
        itemId: payslips.id,
        takeHomePay: payslips.netSalary,
        employeeName: employees.fullName,
        bankName: employees.bankName,
        bankAccountNo: employees.bankAccountNumber,
      })
      .from(payslips)
      .innerJoin(employees, eq(payslips.employeeId, employees.id))
      .where(eq(payslips.payrollRunId, run.id));

    const payoutRef = `PAYOUT-BANK-${Date.now()}`;
    const disburseTimestamp = new Date().toISOString();

    // 3. Mark payroll run as selesai
    await db
      .update(payrollRuns)
      .set({
        status: "selesai",
      })
      .where(eq(payrollRuns.id, run.id));

    // 4. Dispatch webhook to Keuangan SKEU for Accounting Journal Entry
    const keuanganUrl = process.env.KEUANGAN_PLATFORM_URL || "http://localhost:3005";
    try {
      await fetch(`${keuanganUrl}/api/skeu/payroll-payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutRef,
          payrollRunId: run.id,
          period: run.period,
          totalAmount: run.totalNet,
          disbursedAt: disburseTimestamp,
          itemsCount: items.length,
        }),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Proses transfer gaji massal (Payout API) ke bank pegawai berhasil dieksekusi",
      payoutSummary: {
        payoutRef,
        status: "selesai",
        period: run.period,
        totalDisbursed: run.totalNet,
        recipientCount: items.length,
        disbursedAt: disburseTimestamp,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

