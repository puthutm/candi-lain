import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentInvoices, studentInvoiceItems } from "@/db/schema/invoices";
import { siakadStudents } from "@/db/schema/siakad";
import { tuitionRates } from "@/db/schema/master";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role === "mahasiswa") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { academicPeriodLabel, studyProgramId } = body;

    if (!academicPeriodLabel) {
      return NextResponse.json({ success: false, error: "Missing academicPeriodLabel" }, { status: 400 });
    }

    // Get active tuition rate for this period
    const rateQuery = db.select().from(tuitionRates)
      .where(eq(tuitionRates.academicPeriodLabel, academicPeriodLabel));

    const rates = await rateQuery;
    if (rates.length === 0) {
      return NextResponse.json({ success: false, error: "No tuition rate found for this period" }, { status: 400 });
    }

    const rate = rates[0];
    if (!rate) {
      return NextResponse.json({ success: false, error: "Invalid tuition rate data" }, { status: 400 });
    }

    // Get active students from SIAKAD
    const studentQuery = db.select().from(siakadStudents);
    const allStudents = await studentQuery;

    let targetStudents = allStudents;
    if (studyProgramId) {
      targetStudents = allStudents.filter(s => s.studyProgramId === studyProgramId);
    }

    if (targetStudents.length === 0) {
      return NextResponse.json({ success: false, error: "No active students found" }, { status: 400 });
    }

    // Check existing invoices for this period to avoid duplicates
    const existingInvoices = await db.select()
      .from(studentInvoices)
      .where(eq(studentInvoices.academicPeriodLabel, academicPeriodLabel));

    const existingUserIds = new Set(existingInvoices.map(i => i.studentUserId));

    // Filter out students who already have invoices
    const newStudents = targetStudents.filter(s => s.userId && !existingUserIds.has(s.userId));

    if (newStudents.length === 0) {
      return NextResponse.json({ success: false, error: "All students already have invoices for this period" }, { status: 400 });
    }

    // Generate invoices
    const generatedInvoices: Array<{ id: string; invoiceNumber: string }> = [];
    const batchSize = 50;

    for (let i = 0; i < newStudents.length; i += batchSize) {
      const batch = newStudents.slice(i, i + batchSize);

      for (const student of batch) {
        if (!student.userId) continue;
        
        const invoiceNumber = `INV/${academicPeriodLabel}/${student.userId.slice(0, 8).toUpperCase()}/${Date.now()}`;

        const inserted = await db.insert(studentInvoices).values({
          studentUserId: student.userId,
          invoiceNumber,
          invoiceType: "ukt",
          academicPeriodLabel,
          totalAmount: rate.totalAmount,
          paidAmount: "0.00",
          outstandingAmount: rate.totalAmount,
          status: "outstanding",
          dueDate: getDefaultDueDate(),
        }).returning();

        const invoice = inserted[0];
        if (!invoice) {
          console.error(`Failed to create invoice for student ${student.userId}`);
          continue;
        }

        // Create invoice items
        await db.insert(studentInvoiceItems).values([
          {
            invoiceId: invoice.id,
            componentName: "SPP Pokok",
            amount: rate.sppAmount,
          },
          {
            invoiceId: invoice.id,
            componentName: "BOP",
            amount: rate.bopAmount,
          },
        ]);

        generatedInvoices.push(invoice);
      }
    }

    return NextResponse.json({
      success: true,
      count: generatedInvoices.length,
      message: `Generated ${generatedInvoices.length} invoices for ${academicPeriodLabel}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function getDefaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split("T")[0] ?? "";
}

export const dynamic = "force-dynamic";
