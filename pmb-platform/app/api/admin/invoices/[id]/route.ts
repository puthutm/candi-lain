import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbInvoices, pmbPaymentTransactions } from "@/db/schema/payment";
import { pmbApplicants } from "@/db/schema/applicants";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { ALL_PMB_ROLES } from "@/lib/sso-middleware";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const cookie = (await cookies()).get("pmb_user");
    const user = cookie?.value ? JSON.parse(cookie.value) : null;
    const role = (session?.user as any)?.role || user?.role;

    const isAdmin = role && (ALL_PMB_ROLES.includes(role as any) || role === "admin" || user?.isAdmin);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, method, providerRef } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: "Missing status" }, { status: 400 });
    }

    // Update invoice status
    const updated = await db
      .update(pmbInvoices)
      .set({ status })
      .where(eq(pmbInvoices.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const invoice = updated[0];

    // If marking as paid, create payment transaction + update applicant paymentStatus
    if (status === "paid" && invoice) {
      await db.insert(pmbPaymentTransactions).values({
        invoiceId: invoice.id,
        method: method || "transfer_bank",
        providerRef: providerRef || "manual_admin",
        amount: invoice.amount,
        status: "success",
        paidAt: new Date(),
      });

      // Update applicant payment status
      await db
        .update(pmbApplicants)
        .set({ paymentStatus: "lunas", updatedAt: new Date() })
        .where(eq(pmbApplicants.id, invoice.applicantId));
    }

    return NextResponse.json({ success: true, invoice: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
