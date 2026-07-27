import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { studentInvoices, payments, financeClearanceStatus } from "@/db/schema/schema";
import { eq, and } from "drizzle-orm";
import { siakadClient } from "@/lib/siakad-client";

// Idempotency key storage (in-memory untuk sementara, idealnya pakai Redis)
const processedPayments = new Set<string>();

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

    console.log(`[Webhook] Payment received - Order: ${order_id}, Status: ${transaction_status}, TX: ${transaction_id}`);

    // 1. Idempotency check menggunakan transaction_id
    if (processedPayments.has(transaction_id)) {
      return NextResponse.json({ success: true, message: "Already processed (idempotent)" });
    }

    // 2. Lookup invoice
    const [invoice] = await db
      .select()
      .from(studentInvoices)
      .where(eq(studentInvoices.invoiceNumber, order_id))
      .limit(1);

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    // 3. Process status updates with idempotent transaction
    if (transaction_status === "settlement" || transaction_status === "capture") {
      // Double-check in database untuk idempotency
      const [existingPayment] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.providerRef, transaction_id),
            eq(payments.status, "success")
          )
        )
        .limit(1);

      if (existingPayment) {
        processedPayments.add(transaction_id);
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
        const [_payment] = await tx
          .insert(payments)
          .values({
            invoiceId: invoice.id,
            channel: payment_type === "bank_transfer" ? "virtual_account" : 
                     payment_type === "qris" ? "qris" :
                     payment_type === "credit_card" ? "kartu_kredit" : "virtual_account",
            providerRef: transaction_id,
            amount: gross_amount,
            status: "success",
            autoReconciled: true,
            paidAt: new Date(),
          })
          .returning();

        // 4. Update academic clearance status to "aktif" if fully paid
        if (invoiceStatus === "lunas") {
          await tx
            .insert(financeClearanceStatus)
            .values({
              studentUserId: invoice.studentUserId,
              status: "aktif",
              reason: "Tagihan lunas - Pembayaran via " + payment_type,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: financeClearanceStatus.studentUserId,
              set: {
                status: "aktif",
                reason: "Tagihan lunas - Pembayaran via " + payment_type,
                updatedAt: new Date(),
              },
            });

          // Publish clearance event ke SIAKAD
          try {
            await siakadClient.publishClearanceEvent({
              userId: invoice.studentUserId,
              newStatus: "aktif",
              reason: "Tagihan lunas",
              timestamp: new Date().toISOString(),
            });
            console.log(`[Webhook] Clearance event published to SIAKAD for ${invoice.studentUserId}`);
          } catch (err) {
            console.error(`[Webhook] Failed to publish clearance to SIAKAD:`, err);
            // Non-blocking: jurnal tetap tercatat
          }
        }

        // Mark as processed
        processedPayments.add(transaction_id);
      });
    } else if (transaction_status === "expire" || transaction_status === "cancel" || transaction_status === "deny") {
      // Log failed payment
      await db
        .update(payments)
        .set({ status: "failed" })
        .where(eq(payments.providerRef, transaction_id));
      
      console.log(`[Webhook] Payment failed/expired for order ${order_id}`);
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error: any) {
    console.error("[Webhook] Processing error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
