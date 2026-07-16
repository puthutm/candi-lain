import { NextResponse } from "next/server";
import { db } from "@/db";
import { tuitionRates, chartOfAccounts, studentInvoices, payments } from "@/db/schema/schema";
import { siakadStudyPrograms } from "@/db/schema/siakad";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // 1. Validate session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role === "mahasiswa") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // 2. Auto-seed CoA accounts if empty
    let coa = await db.select().from(chartOfAccounts);
    if (coa.length === 0) {
      await db.insert(chartOfAccounts).values([
        { accountCode: "1101", accountName: "Kas & Bank (BCA)", accountType: "aset" },
        { accountCode: "1102", accountName: "Kas & Bank (Mandiri)", accountType: "aset" },
        { accountCode: "1201", accountName: "Piutang Mahasiswa", accountType: "aset" },
        { accountCode: "4101", accountName: "Pendapatan SPP / UKT", accountType: "pendapatan" },
        { accountCode: "4102", accountName: "Pendapatan BOP", accountType: "pendapatan" },
        { accountCode: "4103", accountName: "Pendapatan PMB", accountType: "pendapatan" },
        { accountCode: "5101", accountName: "Beban Operasional Gaji Karyawan", accountType: "beban" },
        { accountCode: "5102", accountName: "Beban Operasional Umum", accountType: "beban" },
      ]);
      coa = await db.select().from(chartOfAccounts);
    }

    // 3. Auto-seed tuition rates if empty
    let rates = await db.select().from(tuitionRates);
    if (rates.length === 0) {
      const activeProgs = await db.select().from(siakadStudyPrograms);
      for (const prog of activeProgs) {
        const isSist = prog.name.includes("Sistem");
        const spp = isSist ? 6000000.00 : 6500000.00;
        const bop = 2500000.00;
        const total = spp + bop;
        await db.insert(tuitionRates).values({
          studyProgramRef: prog.id,
          studyProgramNameSnapshot: prog.name,
          academicPeriodLabel: "2026/2027 Ganjil",
          sppAmount: spp.toFixed(2),
          bopAmount: bop.toFixed(2),
          totalAmount: total.toFixed(2),
          requiresYayasanApproval: false,
        });
      }
      rates = await db.select().from(tuitionRates);
    }

    const invoices = await db.select().from(studentInvoices);
    const paymentLogs = await db.select().from(payments);

    return NextResponse.json({ 
      success: true, 
      rates, 
      coa, 
      invoices,
      payments: paymentLogs
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
