import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { studentInvoices, studentInvoiceItems, tuitionRates, financeClearanceStatus } from "@/db/schema/schema";
import { siakadStudents, siakadStudyPrograms } from "@/db/schema/siakad";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { academicPeriodLabel } = body;

    if (!academicPeriodLabel) {
      return NextResponse.json({ success: false, error: "academicPeriodLabel is required" }, { status: 400 });
    }

    // 1. Fetch active students from the central SIAKAD database tables
    const activeStudents = await db
      .select({
        userId: siakadStudents.userId,
        fullName: siakadStudents.fullName,
        studyProgramId: siakadStudents.studyProgramId,
        studyProgramName: siakadStudyPrograms.name,
      })
      .from(siakadStudents)
      .innerJoin(siakadStudyPrograms, eq(siakadStudents.studyProgramId, siakadStudyPrograms.id))
      .where(eq(siakadStudents.academicStatus, "aktif"));

    if (activeStudents.length === 0) {
      return NextResponse.json({ success: true, message: "No active students found in SIAKAD. No invoices generated.", results: [] });
    }

    const results = [];

    // 2. Loop through active students and generate invoices
    for (const student of activeStudents) {
      if (!student.userId) continue;

      // Find matching tuition rate for this prodi & period (or use fallback rate)
      const rates = await db
        .select()
        .from(tuitionRates)
        .where(
          and(
            eq(tuitionRates.studyProgramRef, student.studyProgramId),
            eq(tuitionRates.academicPeriodLabel, academicPeriodLabel)
          )
        )
        .limit(1);

      const spp = rates[0] ? parseFloat(rates[0].sppAmount) : 2500000.00;
      const bop = rates[0] ? parseFloat(rates[0].bopAmount) : 1500000.00;
      const total = spp + bop;

      // Check if invoice already exists to ensure idempotency
      const invoiceNumber = `INV-${academicPeriodLabel.replace(/\s+/g, "")}-${student.userId.substring(0, 8).toUpperCase()}`;
      
      const [existingInvoice] = await db
        .select()
        .from(studentInvoices)
        .where(eq(studentInvoices.invoiceNumber, invoiceNumber))
        .limit(1);

      if (existingInvoice) {
        results.push({ studentUserId: student.userId, invoiceId: existingInvoice.id, status: "skipped_exists" });
        continue;
      }

      // Generate invoice
      const invoiceId = await db.transaction(async (tx: any) => {
        const [insertedInvoice] = await tx
          .insert(studentInvoices)
          .values({
            studentUserId: student.userId,
            invoiceNumber,
            invoiceType: "ukt",
            academicPeriodLabel,
            totalAmount: total.toFixed(2),
            outstandingAmount: total.toFixed(2),
            status: "outstanding",
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!, // 14 days from now
          })
          .returning();

        // Insert invoice components
        await tx.insert(studentInvoiceItems).values({
          invoiceId: insertedInvoice!.id,
          componentName: "SPP Pokok",
          amount: spp.toFixed(2),
        });

        await tx.insert(studentInvoiceItems).values({
          invoiceId: insertedInvoice!.id,
          componentName: "BOP (Biaya Operasional Pendidikan)",
          amount: bop.toFixed(2),
        });

        // Initialize clearance status as aktif
        await tx
          .insert(financeClearanceStatus)
          .values({
            studentUserId: student.userId,
            status: "aktif",
            reason: "Tagihan baru terbit",
            updatedAt: new Date(),
          })
          .onConflictDoNothing();

        return insertedInvoice!.id;
      });

      results.push({ studentUserId: student.userId, invoiceId, status: "generated" });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Batch invoicing generation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
