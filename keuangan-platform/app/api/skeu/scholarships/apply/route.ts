import { NextResponse } from "next/server";
import { db } from "@/db";
import { scholarshipPrograms, scholarshipRecipients } from "@/db/schema/scholarship";
import { studentInvoices, studentInvoiceItems } from "@/db/schema/invoices";
import { eq, and, sql } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { programId, academicPeriod } = body;

    if (!programId || !academicPeriod) {
      return NextResponse.json({ success: false, error: "Missing programId or academicPeriod" }, { status: 400 });
    }

    // 1. Get program details
    const [program] = await db.select().from(scholarshipPrograms).where(eq(scholarshipPrograms.id, programId));
    if (!program) {
      return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });
    }
    if (program.status !== "aktif") {
      return NextResponse.json({ success: false, error: "Program is not active" }, { status: 400 });
    }

    // 2. Find existing recipients for this program & period
    const existingRecipients = await db
      .select()
      .from(scholarshipRecipients)
      .where(
        and(
          eq(scholarshipRecipients.programId, programId),
          eq(scholarshipRecipients.academicPeriod, academicPeriod),
          eq(scholarshipRecipients.status, "aktif")
        )
      );

    if (existingRecipients.length === 0) {
      return NextResponse.json({ success: false, error: "No active recipients found for this program & period" }, { status: 400 });
    }

    if (program.quota > 0 && existingRecipients.length > program.quota) {
      return NextResponse.json({ success: false, error: `Recipients (${existingRecipients.length}) exceed quota (${program.quota})` }, { status: 400 });
    }

    // 3. Apply scholarship to each recipient's invoice
    const results: Array<{ studentUserId: string; status: string; invoiceId?: string }> = [];

    for (const recipient of existingRecipients) {
      // Find outstanding invoice for this student & period
      const [invoice] = await db
        .select()
        .from(studentInvoices)
        .where(
          and(
            eq(studentInvoices.studentUserId, recipient.studentUserId),
            eq(studentInvoices.academicPeriodLabel, academicPeriod),
            sql`${studentInvoices.status} = 'outstanding' OR ${studentInvoices.status} = 'cicilan'`
          )
        )
        .limit(1);

      if (!invoice) {
        results.push({ studentUserId: recipient.studentUserId, status: "no_invoice" });
        continue;
      }

      const nominal = parseFloat(recipient.nominalAwarded);
      const totalAmount = parseFloat(invoice.totalAmount);
      const paidAmount = parseFloat(invoice.paidAmount);
      const remaining = totalAmount - paidAmount;

      // Add scholarship invoice item
      await db.insert(studentInvoiceItems).values({
        invoiceId: invoice.id,
        componentName: `Beasiswa - ${program.name}`,
        amount: nominal.toFixed(2),
        scholarshipRecipientId: recipient.id,
      });

      // Determine new status
      const newOutstanding = Math.max(0, remaining - nominal);
      const newPaidAmount = paidAmount + Math.min(nominal, remaining);
      let newStatus = invoice.status;
      if (newOutstanding <= 0) {
        newStatus = "beasiswa";
      } else if (newPaidAmount > 0) {
        newStatus = "cicilan";
      }

      // Update invoice
      await db
        .update(studentInvoices)
        .set({
          paidAmount: newPaidAmount.toFixed(2),
          outstandingAmount: newOutstanding.toFixed(2),
          status: newStatus as any,
          updatedAt: new Date(),
        })
        .where(eq(studentInvoices.id, invoice.id));

      // Update recipient with invoice reference
      await db
        .update(scholarshipRecipients)
        .set({ invoiceId: invoice.id })
        .where(eq(scholarshipRecipients.id, recipient.id));

      results.push({ studentUserId: recipient.studentUserId, status: "applied", invoiceId: invoice.id });
    }

    return NextResponse.json({
      success: true,
      message: `Applied scholarship to ${results.filter(r => r.status === "applied").length} invoices`,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
