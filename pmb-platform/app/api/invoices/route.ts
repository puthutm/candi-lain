import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbInvoices } from "@/db/schema/payment";
import { pmbApplicants, pmbApplicantStatusHistory } from "@/db/schema/applicants";
import { pmbEntryPaths, pmbWaves } from "@/db/schema/master";
import { pmbFeeRates } from "@/db/schema/keuangan";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const applicantId = searchParams.get("applicantId");

    if (!applicantId) {
      return NextResponse.json({ success: false, error: "Missing applicantId" }, { status: 400 });
    }

    // Fetch applicant with wave + entry path info
    const applicants = await db
      .select({
        id: pmbApplicants.id,
        registrationNumber: pmbApplicants.registrationNumber,
        formFee: pmbEntryPaths.formFee,
        isFree: pmbEntryPaths.isFree,
        entryPathCode: pmbEntryPaths.code,
        waveId: pmbApplicants.waveId,
        academicPeriodLabel: pmbWaves.academicPeriodLabel,
      })
      .from(pmbApplicants)
      .leftJoin(pmbEntryPaths, eq(pmbApplicants.entryPathId, pmbEntryPaths.id))
      .leftJoin(pmbWaves, eq(pmbApplicants.waveId, pmbWaves.id))
      .where(eq(pmbApplicants.id, applicantId))
      .limit(1);

    if (applicants.length === 0) {
      return NextResponse.json({ success: false, error: "Kandidat tidak ditemukan" }, { status: 404 });
    }

    const applicant = applicants[0]!;

    // Try to get fee from keuangan pmb_fee_rates by wave's academic period label
    let finalFee = parseFloat(applicant.formFee || "0");
    let feeSource = "entry_path"; // default

    if (applicant.academicPeriodLabel) {
      try {
        const keuanganRates = await db
          .select()
          .from(pmbFeeRates)
          .where(eq(pmbFeeRates.waveLabel, applicant.academicPeriodLabel))
          .limit(1);

        if (keuanganRates.length > 0) {
          finalFee = parseFloat(keuanganRates[0]!.registrationFee);
          feeSource = "keuangan"; // overridden by keuangan config
        }
      } catch (e) {
        // Fallback to entry path fee if keuangan table doesn't exist yet
        console.warn("pmb_fee_rates table not found, using entry path fee:", e);
      }
    }

    // Override if isFree
    if (applicant.isFree) {
      finalFee = 0;
      feeSource = "gratis";
    }

    // Check existing invoices
    let invoices = await db
      .select()
      .from(pmbInvoices)
      .where(eq(pmbInvoices.applicantId, applicantId));

    // If none exists, create a default formulir invoice
    if (invoices.length === 0) {
      const invoiceNumber = `INV-${applicant.registrationNumber || "UNKNOWN"}-01`;
      const isPaid = finalFee === 0;

      const newInvoices = await db.transaction(async (tx) => {
        const results = await tx
          .insert(pmbInvoices)
          .values({
            applicantId: applicantId as string,
            invoiceNumber: invoiceNumber as string,
            invoiceType: "formulir" as const,
            amount: String(finalFee),
            status: (isPaid ? "paid" : "unpaid") as "paid" | "unpaid",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] as string,
          })
          .returning();

        const inv = results[0];
        if (!inv) throw new Error("Gagal membuat invoice");

        // If free, automatically advance stage
        if (isPaid) {
          await tx
            .update(pmbApplicants)
            .set({ paymentStatus: "lunas", currentStage: "isi_biodata" })
            .where(eq(pmbApplicants.id, applicantId));

          await tx.insert(pmbApplicantStatusHistory).values({
            applicantId,
            fromStage: "bayar_formulir",
            toStage: "isi_biodata",
            note: "Jalur masuk gratis, langsung lanjut isi biodata.",
          });
        }

        return [inv];
      });

      invoices = newInvoices;
    }

    return NextResponse.json({
      success: true,
      invoices,
      fee: finalFee,
      feeSource,
      academicPeriodLabel: applicant.academicPeriodLabel,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
