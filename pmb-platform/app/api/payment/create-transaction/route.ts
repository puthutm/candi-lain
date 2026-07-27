/**
 * Payment Transaction Creation API
 *
 * Membuat transaksi pembayaran baru via payment gateway yang aktif.
 * Endpoint: POST /api/payment/create-transaction
 *
 * Body:
 * - invoiceId: ID invoice yang akan dibayar
 * - selectedMethod: (optional) Kode metode pembayaran spesifik
 * - callbackUrl: (optional) URL redirect setelah pembayaran
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbInvoices } from "@/db/schema/payment";
import { pmbApplicants } from "@/db/schema/applicants";
import { pmbEntryPaths } from "@/db/schema/master";
import { eq } from "drizzle-orm";
import { getGatewayRegistry } from "@/lib/payment/gateway-registry";

export async function POST(req: Request) {
  try {
    const { invoiceId, selectedMethod, callbackUrl } = await req.json();

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: "Missing invoiceId" }, { status: 400 });
    }

    // 1. Cari invoice dengan data pendaftar
    const invoices = await db
      .select({
        invoice: pmbInvoices,
        applicant: pmbApplicants,
        entryPath: pmbEntryPaths,
      })
      .from(pmbInvoices)
      .innerJoin(pmbApplicants, eq(pmbInvoices.applicantId, pmbApplicants.id))
      .leftJoin(pmbEntryPaths, eq(pmbApplicants.entryPathId, pmbEntryPaths.id))
      .where(eq(pmbInvoices.id, invoiceId))
      .limit(1);

    if (invoices.length === 0) {
      return NextResponse.json({ success: false, error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    const { invoice, applicant } = invoices[0]!;

    if (invoice.status === "paid") {
      return NextResponse.json({ success: true, message: "Invoice sudah lunas", alreadyPaid: true });
    }

    // 2. Buat transaksi via gateway
    const registry = getGatewayRegistry();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002";

    const result = await registry.createTransaction({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: parseFloat(invoice.amount),
      customerName: applicant.fullName,
      customerEmail: applicant.email,
      customerPhone: applicant.phone || undefined,
      description: `Pembayaran ${invoice.invoiceType === "formulir" ? "Formulir Pendaftaran" : "Daftar Ulang"} PMB`,
      expiryMinutes: 60 * 24, // 24 jam
      selectedMethod: selectedMethod || undefined,
      callbackUrl: callbackUrl || `${appUrl}/dashboard?tab=tagihan`,
      webhookUrl: `${appUrl}/api/payment/webhook`,
    });

    return NextResponse.json({
      success: true,
      transaction: result,
      gateway: registry.getActiveProvider().name,
    });
  } catch (error: any) {
    console.error("Create transaction error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
