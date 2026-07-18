import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants, pmbApplicantStatusHistory } from "@/db/schema/applicants";
import { pmbInvoices, pmbPaymentTransactions } from "@/db/schema/payment";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Midtrans standard webhook structure or similar
    const { order_id, transaction_status, payment_type, gross_amount, transaction_id } = body;
    
    if (!order_id || !transaction_status) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    // 1. Find invoice by ID or invoiceNumber
    let invoice = null;
    const invById = await db.select().from(pmbInvoices).where(eq(pmbInvoices.id, order_id)).limit(1);
    if (invById.length > 0) {
      invoice = invById[0];
    } else {
      const invByNo = await db.select().from(pmbInvoices).where(eq(pmbInvoices.invoiceNumber, order_id)).limit(1);
      if (invByNo.length > 0) {
        invoice = invByNo[0];
      }
    }

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const isSuccess = ["settlement", "capture", "success"].includes(transaction_status);

    if (isSuccess && invoice.status !== "paid") {
      // Update invoice status
      await db
        .update(pmbInvoices)
        .set({ status: "paid" })
        .where(eq(pmbInvoices.id, invoice.id));

      // Update applicant
      const [applicant] = await db
        .select()
        .from(pmbApplicants)
        .where(eq(pmbApplicants.id, invoice.applicantId))
        .limit(1);

      if (applicant) {
        const nextStage = applicant.currentStage === "peminat" ? "isi_biodata" : applicant.currentStage;
        
        await db
          .update(pmbApplicants)
          .set({
            paymentStatus: "lunas",
            currentStage: nextStage,
            updatedAt: new Date(),
          })
          .where(eq(pmbApplicants.id, applicant.id));

        // Insert history record
        await db.insert(pmbApplicantStatusHistory).values({
          applicantId: applicant.id,
          fromStage: applicant.currentStage,
          toStage: nextStage,
          note: `Pembayaran Invoice #${invoice.invoiceNumber} berhasil divalidasi via Webhook (${payment_type || "online"}).`,
        });
      }

      // Record transaction
      let trxMethod: "virtual_account" | "qris" | "e_wallet" | "transfer_bank" = "virtual_account";
      if (payment_type === "qris") trxMethod = "qris";
      else if (payment_type === "gopay" || payment_type === "shopeepay") trxMethod = "e_wallet";
      else if (payment_type === "bank_transfer") trxMethod = "virtual_account";

      await db.insert(pmbPaymentTransactions).values({
        invoiceId: invoice.id,
        method: trxMethod,
        providerRef: transaction_id || "webhk-ref",
        amount: gross_amount || invoice.amount,
        status: "success",
        webhookPayload: body,
        paidAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
