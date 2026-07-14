import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { studentInvoices, payments, financeClearanceStatus } from "@/db/schema/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      transaction_status,
      payment_type,
      gross_amount,
      transaction_id,
    } = body;

    console.log(`Payment webhook received for order_id: ${order_id}, status: ${transaction_status}`);

    // 2. Lookup invoice
    const [invoice] = await db
      .select()
      .from(studentInvoices)
      .where(eq(studentInvoices.invoiceNumber, order_id))
      .limit(1);

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    // 3. Process status updates (Idempotent check)
    if (transaction_status === "settlement" || transaction_status === "capture") {
      // Verify if payment has already been recorded
      const [existingPayment] = await db
        .select()
        .from(payments)
        .where(eq(payments.providerRef, transaction_id))
        .limit(1);

      if (existingPayment) {
        return NextResponse.json({ success: true, message: "Payment already processed (idempotent)" });
      }

      await db.transaction(async (tx: any) => {
        // Update invoice payment details
        const paidAmount = parseFloat(gross_amount);
        const newPaidAmount = parseFloat(invoice.paidAmount) + paidAmount;
        const outstandingAmount = Math.max(0, parseFloat(invoice.totalAmount) - newPaidAmount);
        const invoiceStatus = outstandingAmount <= 0 ? "lunas" : "cicilan";

        await tx
          .update(studentInvoices)
          .set({
            paidAmount: newPaidAmount.toFixed(2),
            outstandingAmount: outstandingAmount.toFixed(2),
            status: invoiceStatus,
            updatedAt: new Date(),
          })
          .where(eq(studentInvoices.id, invoice.id));

        // Create payment log
        await tx.insert(payments).values({
          invoiceId: invoice.id,
          channel: payment_type === "bank_transfer" ? "virtual_account" : "qris",
          providerRef: transaction_id,
          amount: gross_amount,
          status: "success",
          autoReconciled: true,
          paidAt: new Date(),
        });

        // 4. Update academic clearance status to "aktif" if fully paid/cleared
        if (invoiceStatus === "lunas" || outstandingAmount <= 0) {
          await tx
            .insert(financeClearanceStatus)
            .values({
              studentUserId: invoice.studentUserId,
              status: "aktif",
              reason: "Tagihan lunas",
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: financeClearanceStatus.studentUserId,
              set: {
                status: "aktif",
                reason: "Tagihan lunas",
                updatedAt: new Date(),
              },
            });

          console.log(`Student ${invoice.studentUserId} clearance status updated to AKTIF`);
        }
      });
    } else if (transaction_status === "expire" || transaction_status === "cancel" || transaction_status === "deny") {
      await db
        .update(payments)
        .set({ status: "failed" })
        .where(eq(payments.providerRef, transaction_id));
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
