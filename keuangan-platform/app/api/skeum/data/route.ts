import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentInvoices, studentInvoiceItems, payments, financeClearanceStatus } from "@/db/schema/schema";
import { eq } from "drizzle-orm";
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

    // 2. Fetch student invoices
    const invoices = await db
      .select()
      .from(studentInvoices)
      .where(eq(studentInvoices.studentUserId, sessionUser.userId));

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
        .where(eq(payments.invoiceId, inv.id));
      paymentLogs.push(...payList);
    }

    // 5. Fetch clearance status
    const [clearance] = await db
      .select()
      .from(financeClearanceStatus)
      .where(eq(financeClearanceStatus.studentUserId, sessionUser.userId))
      .limit(1);

    return NextResponse.json({
      success: true,
      invoices,
      invoiceItems: invoiceItemsList,
      payments: paymentLogs,
      clearance: clearance || { status: "aktif", reason: "Tidak ada tunggakan" },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
