import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentInvoices } from "@/db/schema/invoices";
import { installmentPlans, installmentTerms } from "@/db/schema/installment";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * FR-4.4: Pengajuan Keringanan/Cicilan oleh Mahasiswa (SKEUM)
 * POST /api/skeum/relief/request
 */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role !== "mahasiswa") {
      return NextResponse.json({ success: false, error: "Only students can submit relief requests" }, { status: 403 });
    }

    const body = await req.json();
    const { invoiceId, scheme, reason, documentUrl } = body;

    if (!invoiceId || !scheme || !reason) {
      return NextResponse.json({ success: false, error: "Missing required fields: invoiceId, scheme, reason" }, { status: 400 });
    }

    if (!["cicilan_2x", "cicilan_3x", "penundaan_1bulan"].includes(scheme)) {
      return NextResponse.json({ success: false, error: "Invalid scheme. Use: cicilan_2x, cicilan_3x, or penundaan_1bulan" }, { status: 400 });
    }

    // Verify invoice exists and belongs to student
    const [invoice] = await db.select().from(studentInvoices).where(eq(studentInvoices.id, invoiceId)).limit(1);
    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }
    if (invoice.studentUserId !== sessionUser.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: not your invoice" }, { status: 403 });
    }
    if (invoice.status === "lunas") {
      return NextResponse.json({ success: false, error: "Invoice is already paid" }, { status: 400 });
    }

    // Check if there's already a pending installment plan
    const [existing] = await db.select().from(installmentPlans).where(eq(installmentPlans.invoiceId, invoiceId)).limit(1);
    if (existing && existing.status === "diajukan") {
      return NextResponse.json({ success: false, error: "There is already a pending installment request for this invoice" }, { status: 400 });
    }

    const outstandingAmount = parseFloat(invoice.outstandingAmount);
    const termCount = scheme === "cicilan_2x" ? 2 : scheme === "cicilan_3x" ? 3 : 1;
    const termAmount = (outstandingAmount / termCount).toFixed(2);
    const now = new Date();

    // Create installment plan
    const [plan] = await db
      .insert(installmentPlans)
      .values({
        invoiceId,
        scheme: scheme as any,
        termCount: termCount.toString(),
        reason,
        documentUrl: documentUrl || null,
        status: "diajukan",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create installment terms
    const terms = [];
    for (let i = 1; i <= termCount; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + i);
      terms.push({
        installmentPlanId: plan!.id,
        termNumber: i.toString(),
        amount: termAmount,
        dueDate: dueDate.toISOString().split("T")[0]!,
        status: "belum_bayar" as const,
      });
    }
    await db.insert(installmentTerms).values(terms);

    return NextResponse.json({
      success: true,
      message: "Relief request submitted successfully",
      plan,
      terms,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role !== "mahasiswa") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const plans = await db
      .select()
      .from(installmentPlans)
      .innerJoin(studentInvoices, eq(installmentPlans.invoiceId, studentInvoices.id))
      .where(eq(studentInvoices.studentUserId, sessionUser.userId))
      .orderBy(installmentPlans.createdAt);

    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
