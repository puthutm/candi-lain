import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants, pmbApplicantStatusHistory } from "@/db/schema/applicants";
import { pmbInvoices, pmbPaymentTransactions } from "@/db/schema/payment";
import { eq, and } from "drizzle-orm";
import { getGatewayRegistry } from "@/lib/payment/gateway-registry";

/**
 * Payment Webhook Handler
 *
 * Menerima notifikasi pembayaran dari berbagai payment gateway (Midtrans, Xendit, dll)
 * dengan mekanisme idempotensi untuk mencegah duplikasi.
 *
 * Endpoint: POST /api/payment/webhook
 * Body: Raw payload dari payment gateway
 * Headers: Signature untuk verifikasi (tergantung provider)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Parse headers untuk verifikasi signature
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Gunakan gateway registry untuk parse webhook payload
    const registry = getGatewayRegistry();
    const parsedPayload = await registry.parseWebhookPayload(body, headers);

    const { orderId, transactionId, transactionStatus, paymentMethod, grossAmount, paidAt } = parsedPayload;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing order_id in payload" }, { status: 400 });
    }

    // Verifikasi signature jika ada
    const signature = headers["x-midtrans-signature"] || headers["x-xendit-signature"] || headers["signature"] || "";
    if (signature) {
      const isValid = await registry.verifyWebhookSignature(body, signature);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 401 });
      }
    }

    // 1. Cari invoice berdasarkan orderId (invoiceNumber atau ID)
    let invoice = null;
    const invById = await db.select().from(pmbInvoices).where(eq(pmbInvoices.id, orderId)).limit(1);
    if (invById.length > 0) {
      invoice = invById[0];
    } else {
      const invByNo = await db.select().from(pmbInvoices).where(eq(pmbInvoices.invoiceNumber, orderId)).limit(1);
      if (invByNo.length > 0) {
        invoice = invByNo[0];
      }
    }

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    // 2. Idempotensi: cek apakah transaksi dengan idempotencyKey sudah diproses
    const idempotencyKey = headers["x-idempotency-key"] || `${transactionId || orderId}-${Date.now()}`;
    const existingTrx = await db
      .select()
      .from(pmbPaymentTransactions)
      .where(
        and(
          eq(pmbPaymentTransactions.invoiceId, invoice.id),
          eq(pmbPaymentTransactions.idempotencyKey, idempotencyKey)
        )
      )
      .limit(1);

    if (existingTrx.length > 0) {
      // Transaksi sudah diproses, return sukses (idempotent)
      return NextResponse.json({
        success: true,
        message: "Webhook already processed (idempotent)",
        transactionId: existingTrx[0]!.id,
      });
    }

    // 3. Proses berdasarkan status transaksi
    const isSuccess = transactionStatus === "success";

    if (isSuccess && invoice.status !== "paid") {
      // Gunakan transaction untuk atomicity
      await db.transaction(async (tx) => {
        // Update invoice status
        await tx
          .update(pmbInvoices)
          .set({ status: "paid" })
          .where(eq(pmbInvoices.id, invoice.id));

        // Update applicant
        const [applicant] = await tx
          .select()
          .from(pmbApplicants)
          .where(eq(pmbApplicants.id, invoice.applicantId))
          .limit(1);

        if (applicant) {
          const nextStage = applicant.currentStage === "peminat" ? "isi_biodata" : applicant.currentStage;
          
          await tx
            .update(pmbApplicants)
            .set({
              paymentStatus: "lunas",
              currentStage: nextStage,
              updatedAt: new Date(),
            })
            .where(eq(pmbApplicants.id, applicant.id));

          // Insert history record
          await tx.insert(pmbApplicantStatusHistory).values({
            applicantId: applicant.id,
            fromStage: applicant.currentStage,
            toStage: nextStage,
            note: `Pembayaran Invoice #${invoice.invoiceNumber} berhasil divalidasi via Webhook (${paymentMethod || "online"}).`,
          });
        }

        // Map payment method
        let trxMethod: "virtual_account" | "qris" | "e_wallet" | "transfer_bank" = "virtual_account";
        const pm = (paymentMethod || "").toLowerCase();
        if (pm.includes("qris")) trxMethod = "qris";
        else if (pm.includes("gopay") || pm.includes("shopeepay") || pm.includes("ewallet")) trxMethod = "e_wallet";
        else if (pm.includes("bank_transfer") || pm.includes("va")) trxMethod = "virtual_account";
        else if (pm.includes("cstore") || pm.includes("retail")) trxMethod = "transfer_bank";

        // Record transaction with idempotency key
        await tx.insert(pmbPaymentTransactions).values({
          invoiceId: invoice.id,
          method: trxMethod,
          providerRef: transactionId || `webhk-${Date.now()}`,
          amount: grossAmount ? String(grossAmount) : invoice.amount,
          status: "success",
          idempotencyKey,
          webhookPayload: body,
          paidAt: paidAt || new Date(),
        });
      });
    } else if (transactionStatus === "failed" || transactionStatus === "expired") {
      // Catat transaksi gagal untuk audit
      await db.insert(pmbPaymentTransactions).values({
        invoiceId: invoice.id,
        method: "virtual_account",
        providerRef: transactionId || `webhk-${Date.now()}`,
        amount: grossAmount ? String(grossAmount) : invoice.amount,
        status: transactionStatus === "expired" ? "failed" : "failed",
        idempotencyKey,
        webhookPayload: body,
      });
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error: any) {
    console.error("Payment webhook error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
