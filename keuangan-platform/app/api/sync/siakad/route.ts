import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { studentInvoices, studentInvoiceItems, tuitionRates, financeClearanceStatus } from "@/db/schema/schema";
import { siakadStudents, siakadStudyPrograms } from "@/db/schema/siakad";
import { eq, and } from "drizzle-orm";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const remoteStudyPrograms = pgTable("siakad_study_programs", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
});

const remoteStudents = pgTable("siakad_students", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id"),
  fullName: text("full_name").notNull(),
  studyProgramId: uuid("study_program_id").notNull(),
  academicStatus: text("academic_status").notNull(),
});

export async function POST(request: NextRequest) {
  let siakadClient;
  try {
    const body = await request.json();
    const { academicPeriodLabel } = body;

    if (!academicPeriodLabel) {
      return NextResponse.json({ success: false, error: "academicPeriodLabel is required" }, { status: 400 });
    }

    // 1. Establish connection and sync master caches from siakad_platform database
    const hrisUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/hris_platform";
    const siakadUrl = hrisUrl.replace("/hris_platform", "/siakad_platform").replace("/keuangan_platform", "/siakad_platform");
    
    try {
      siakadClient = postgres(siakadUrl, { prepare: false });
      const siakadDb = drizzle(siakadClient);
      
      const remoteProgs = await siakadDb.select().from(remoteStudyPrograms);
      const remoteStus = await siakadDb.select().from(remoteStudents);
      
      // Upsert into local siakadStudyPrograms cache
      for (const prog of remoteProgs) {
        await db.insert(siakadStudyPrograms).values({
          id: prog.id,
          name: prog.name,
        }).onConflictDoUpdate({
          target: siakadStudyPrograms.id,
          set: { name: prog.name }
        });
      }
      
      // Upsert into local siakadStudents cache
      for (const stu of remoteStus) {
        if (!stu.userId) continue;
        await db.insert(siakadStudents).values({
          id: stu.id,
          userId: stu.userId,
          fullName: stu.fullName,
          studyProgramId: stu.studyProgramId,
          academicStatus: stu.academicStatus,
        }).onConflictDoUpdate({
          target: siakadStudents.id,
          set: {
            fullName: stu.fullName,
            studyProgramId: stu.studyProgramId,
            academicStatus: stu.academicStatus,
            userId: stu.userId,
          }
        });
      }
    } catch (e) {
      console.warn("Could not query central siakad_platform database, using local cache fallback.", e);
    } finally {
      if (siakadClient) {
        await siakadClient.end();
      }
    }

    // 2. Fetch active students from the cached SIAKAD tables
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

    // 3. Loop through active students and generate invoices
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

      const spp = rates[0] ? parseFloat(rates[0].sppAmount) : 5500000.00;
      const bop = rates[0] ? parseFloat(rates[0].bopAmount) : 2500000.00;
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
