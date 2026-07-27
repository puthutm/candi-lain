import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentInvoices, studentInvoiceItems, payments } from "@/db/schema/invoices";
import { financeClearanceStatus } from "@/db/schema/clearance";
import { eq, desc, and } from "drizzle-orm";
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

    // 2. Fetch student invoices with items
    const invoices = await db
      .select()
      .from(studentInvoices)
      .where(eq(studentInvoices.studentUserId, sessionUser.userId))
      .orderBy(desc(studentInvoices.createdAt));

    // 3. Fetch invoice breakdown items
    const invoiceItemsList = [];
    for (const inv of invoices) {
      const items = await db
        .select()
        .from(studentInvoiceItems)
        .where(eq(studentInvoiceItems.invoiceId, inv.id));
      invoiceItemsList.push(...items);
    }

    // 4. Fetch payments
    const paymentLogs = [];
    for (const inv of invoices) {
      const payList = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.invoiceId, inv.id),
            eq(payments.status, "success")
          )
        )
        .orderBy(desc(payments.paidAt));
      paymentLogs.push(...payList);
    }

    // 5. Fetch clearance status
    const [clearance] = await db
      .select()
      .from(financeClearanceStatus)
      .where(eq(financeClearanceStatus.studentUserId, sessionUser.userId))
      .limit(1);

    // 6. Calculate summaries
    const totalTagihan = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
    const totalTerbayar = invoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount), 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + parseFloat(inv.outstandingAmount), 0);
    const tagihanAktif = invoices.filter(inv => inv.status === "outstanding" || inv.status === "overdue");
    const tagihanLunas = invoices.filter(inv => inv.status === "lunas");

    // 7. Check overdue status
    const hasOverdue = tagihanAktif.some(inv => {
      const dueDate = new Date(inv.dueDate);
      return dueDate < new Date();
    });

    const clearanceInfo = clearance 
      ? clearance
      : { 
          status: hasOverdue ? "lms_dibatasi" : "aktif", 
          reason: hasOverdue ? "Terdapat tagihan overdue" : "Tidak ada tunggakan" 
        };

    return NextResponse.json({
      success: true,
      summary: {
        totalTagihan: totalTagihan.toFixed(2),
        totalTerbayar: totalTerbayar.toFixed(2),
        totalOutstanding: totalOutstanding.toFixed(2),
        totalInvoices: invoices.length,
        tagihanAktif: tagihanAktif.length,
        tagihanLunas: tagihanLunas.length,
        collectionRate: totalTagihan > 0 
          ? ((totalTerbayar / totalTagihan) * 100).toFixed(1) 
          : "0.0",
      },
      invoices,
      invoiceItems: invoiceItemsList,
      payments: paymentLogs,
      clearance: clearanceInfo,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
