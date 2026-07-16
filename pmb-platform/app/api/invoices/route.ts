import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbInvoices } from "@/db/schema/payment";
import { pmbApplicants } from "@/db/schema/applicants";
import { pmbEntryPaths } from "@/db/schema/master";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const applicantId = searchParams.get("applicantId");

    if (!applicantId) {
      return NextResponse.json({ success: false, error: "Missing applicantId" }, { status: 400 });
    }

    // Check if applicant exists
    const applicants = await db
      .select({
        id: pmbApplicants.id,
        registrationNumber: pmbApplicants.registrationNumber,
        formFee: pmbEntryPaths.formFee,
        isFree: pmbEntryPaths.isFree,
      })
      .from(pmbApplicants)
      .leftJoin(pmbEntryPaths, eq(pmbApplicants.entryPathId, pmbEntryPaths.id))
      .where(eq(pmbApplicants.id, applicantId))
      .limit(1);

    if (applicants.length === 0) {
      return NextResponse.json({ success: false, error: "Kandidat tidak ditemukan" }, { status: 404 });
    }

    const applicant = applicants[0]!;

    // Check existing invoices
    let invoices = await db
      .select()
      .from(pmbInvoices)
      .where(eq(pmbInvoices.applicantId, applicantId));

    // If none exists, create a default formulir invoice
    if (invoices.length === 0) {
      const invoiceNumber = `INV-${applicant.registrationNumber || "UNKNOWN"}-01`;
      const isPaid = !!applicant.isFree;

      const newInvoices = await db.transaction(async (tx) => {
        const results = await tx
          .insert(pmbInvoices)
          .values({
            applicantId: applicantId as string,
            invoiceNumber: invoiceNumber as string,
            invoiceType: "formulir" as const,
            amount: (applicant.formFee || "0.00") as string,
            status: (isPaid ? "paid" : "unpaid") as "paid" | "unpaid",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] as string,
          })
          .returning();

        const inv = results[0];
        if (!inv) {
          throw new Error("Gagal membuat invoice");
        }

        // If free, transition applicant to lunas/isi_biodata automatically
        if (isPaid) {
          await tx
            .update(pmbApplicants)
            .set({ paymentStatus: "lunas", currentStage: "isi_biodata" })
            .where(eq(pmbApplicants.id, applicantId));
        }

        return [inv];
      });

      invoices = newInvoices;
    }

    return NextResponse.json({ success: true, invoices });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
