import { NextResponse } from "next/server";
import { db } from "@/db";
import { tuitionRates, chartOfAccounts, studentInvoices } from "@/db/schema";

export async function GET() {
  try {
    const rates = await db.select().from(tuitionRates);
    const coa = await db.select().from(chartOfAccounts);
    const invoices = await db.select().from(studentInvoices);
    return NextResponse.json({ success: true, rates, coa, invoices });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
