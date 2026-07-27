import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentInvoices, payments } from "@/db/schema/invoices";
import { eq, and, inArray } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role === "mahasiswa") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { invoiceIds } = body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ success: false, error: "Missing invoiceIds array" }, { status: 400 });
    }

    // Get invoices that are still outstanding but might have payments
    const targetInvoices = await db
      .select()
      .from(studentInvoices)
      .where(
        and(
          inArray(studentInvoices.id, invoiceIds),
          eq(studentInvoices.status, "outstanding")
        )
      );

    if (targetInvoices.length === 0) {
      return NextResponse.json({ success: false, error: "No outstanding invoices found for resync" }, { status: 400 });
    }

    // Check for any payments that might have been missed
    const resyncedInvoices = [];
    for (const invoice of targetInvoices) {
      const invoicePayments = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.invoiceId, invoice.id),
            eq(payments.status, "success")
          )
        );

      if (invoicePayments.length > 0) {
        const totalPaid = invoicePayments.reduce(
          (sum, p) => sum + parseFloat(p.amount),
          0
        );
        const outstandingAmount = Math.max(
          0,
          parseFloat(invoice.totalAmount) - totalPaid
        );
        const newStatus = outstandingAmount <= 0 ? "lunas" : "cicilan";

        await db
          .update(studentInvoices)
          .set({
            paidAmount: totalPaid.toFixed(2),
            outstandingAmount: outstandingAmount.toFixed(2),
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(studentInvoices.id, invoice.id));

        resyncedInvoices.push({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          oldStatus: invoice.status,
          newStatus,
          totalPaid,
        });
      }
    }

    return NextResponse.json({
      success: true,
      resyncedCount: resyncedInvoices.length,
      invoices: resyncedInvoices,
      message: `Resynced ${resyncedInvoices.length} invoices`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
