import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants } from "@/db/schema/applicants";
import { pmbInvoices, pmbPaymentTransactions } from "@/db/schema/payment";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const invoices = await db
      .select({
        id: pmbInvoices.id,
        invoiceNumber: pmbInvoices.invoiceNumber,
        invoiceType: pmbInvoices.invoiceType,
        amount: pmbInvoices.amount,
        status: pmbInvoices.status,
        dueDate: pmbInvoices.dueDate,
        createdAt: pmbInvoices.createdAt,
        applicantId: pmbApplicants.id,
        applicantName: pmbApplicants.fullName,
        applicantEmail: pmbApplicants.email,
        applicantRef: pmbApplicants.registrationNumber,
      })
      .from(pmbInvoices)
      .leftJoin(pmbApplicants, eq(pmbInvoices.applicantId, pmbApplicants.id))
      .orderBy(desc(pmbInvoices.createdAt));

    // Get latest payment transaction per invoice
    const txByInvoice: Record<string, any> = {};
    const transactions = await db
      .select({
        invoiceId: pmbPaymentTransactions.invoiceId,
        method: pmbPaymentTransactions.method,
        providerRef: pmbPaymentTransactions.providerRef,
        amount: pmbPaymentTransactions.amount,
        status: pmbPaymentTransactions.status,
        paidAt: pmbPaymentTransactions.paidAt,
      })
      .from(pmbPaymentTransactions)
      .orderBy(desc(pmbPaymentTransactions.paidAt));

    for (const tx of transactions) {
      if (!txByInvoice[tx.invoiceId]) {
        txByInvoice[tx.invoiceId] = tx;
      }
    }

    const mapped = invoices.map((inv) => ({
      ...inv,
      latestTransaction: txByInvoice[inv.id] || null,
    }));

    return NextResponse.json({ success: true, invoices: mapped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
