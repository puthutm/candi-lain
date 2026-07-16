import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbInvoices } from "@/db/schema/payment";
import { pmbApplicants } from "@/db/schema/applicants";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { applicantId, invoiceId } = await req.json();

    if (!applicantId) {
      return NextResponse.json({ success: false, error: "Missing applicantId" }, { status: 400 });
    }

    // Find invoice to pay
    const query = invoiceId
      ? eq(pmbInvoices.id, invoiceId)
      : and(eq(pmbInvoices.applicantId, applicantId), eq(pmbInvoices.invoiceType, "formulir"));

    const invoices = await db
      .select()
      .from(pmbInvoices)
      .where(query)
      .limit(1);

    if (invoices.length === 0) {
      return NextResponse.json({ success: false, error: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    const invoice = invoices[0]!;

    if (invoice.status === "paid") {
      return NextResponse.json({ success: true, message: "Tagihan sudah lunas" });
    }

    // Update in transaction
    await db.transaction(async (tx) => {
      // 1. Update invoice to paid
      await tx
        .update(pmbInvoices)
        .set({ status: "paid" })
        .where(eq(pmbInvoices.id, invoice.id));

      // 2. Update applicant status
      await tx
        .update(pmbApplicants)
        .set({
          paymentStatus: "lunas",
          currentStage: "isi_biodata",
        })
        .where(eq(pmbApplicants.id, invoice.applicantId));
    });

    return NextResponse.json({
      success: true,
      message: "Pembayaran berhasil disimulasikan!",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
