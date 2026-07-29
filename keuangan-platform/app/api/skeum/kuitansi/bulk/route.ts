import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { studentInvoices, payments } from "@/db/schema/invoices";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");

    let query = db
      .select({
        id: studentInvoices.id,
        invoiceNumber: studentInvoices.invoiceNumber,
        invoiceType: studentInvoices.invoiceType,
        academicPeriodLabel: studentInvoices.academicPeriodLabel,
        totalAmount: studentInvoices.totalAmount,
        paidAmount: studentInvoices.paidAmount,
        status: studentInvoices.status,
        updatedAt: studentInvoices.updatedAt,
      })
      .from(studentInvoices)
      .where(eq(studentInvoices.status, "lunas"));

    const paidInvoices = await query;

    const kuitansiList = paidInvoices.map((inv) => {
      const year = new Date(inv.updatedAt).getFullYear();
      const receiptNumber = `${year}/KWI-UNSIA/${inv.invoiceNumber}`;
      return {
        receiptNumber,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceType: inv.invoiceType,
        period: inv.academicPeriodLabel,
        amount: inv.paidAmount,
        paidAt: inv.updatedAt,
        downloadUrl: `/api/skeum/kuitansi/${inv.id}`,
      };
    });

    return NextResponse.json({
      success: true,
      totalItems: kuitansiList.length,
      totalAmountPaid: kuitansiList.reduce((acc, curr) => acc + parseFloat(curr.amount || "0"), 0),
      receipts: kuitansiList,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
