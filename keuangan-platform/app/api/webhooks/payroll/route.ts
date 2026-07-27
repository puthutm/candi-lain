import { NextResponse } from "next/server";

// POST: Receive payroll disbursement ready webhook from HRIS / SDM Platform
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { payrollRunId, period, eligibleEmployeeCount, totalGross, totalNet, disburseDate, source } = payload;

    if (!payrollRunId || !period || !totalNet) {
      return NextResponse.json({ success: false, error: "Payload webhook payroll tidak lengkap" }, { status: 400 });
    }

    console.log(`[Keuangan Webhook Receiver] Received payroll disbursement event from ${source || "HRIS"}:`);
    console.log(`  - Periode: ${period}`);
    console.log(`  - Jumlah Pegawai: ${eligibleEmployeeCount}`);
    console.log(`  - Total Gross: Rp ${Number(totalGross).toLocaleString("id-ID")}`);
    console.log(`  - Total Net (Cair): Rp ${Number(totalNet).toLocaleString("id-ID")}`);
    console.log(`  - Target Disburse: ${disburseDate}`);

    // Simulation of recording double-entry journal in Keuangan
    // Debet: Beban Gaji & Tunjangan Pegawai
    // Kredit: Kas/Bank Penampung Operasional (BCA/Mandiri)
    const journalEntry = {
      journalId: `JRN-PAYROLL-${payrollRunId.slice(0, 8).toUpperCase()}`,
      period,
      debitAccount: "5-101 (Beban Gaji & Tunjangan Pegawai)",
      creditAccount: "1-101 (Kas / Bank Operasional Institusi)",
      amount: totalNet,
      status: "posted",
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Webhook disbursement payroll berhasil diterima & dicatat dalam jurnal Keuangan",
      journalEntry,
    });
  } catch (error: any) {
    console.error(`[Keuangan Webhook Receiver Error]:`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
