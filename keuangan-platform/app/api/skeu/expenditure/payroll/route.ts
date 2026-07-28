import { NextResponse } from "next/server";
import { db } from "@/db";
import { payrollDisbursements, payrollDisbursementItems } from "@/db/schema/expenditure";
import { desc } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const runs = await db.select().from(payrollDisbursements).orderBy(desc(payrollDisbursements.createdAt));
    return NextResponse.json({ success: true, runs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { period, source, totalGross, totalTax, totalNet, approvedBy, items } = body;

    if (!period || !totalGross || !totalNet) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const [run] = await db.insert(payrollDisbursements).values({
      period,
      source: source || "hris",
      totalGross: totalGross.toString(),
      totalTax: (totalTax || 0).toString(),
      totalNet: totalNet.toString(),
      status: approvedBy ? "disetujui" : "draf",
      approvedBy: approvedBy || null,
    }).returning();

    if (Array.isArray(items) && items.length > 0) {
      const values = items.map((item: any) => ({
        payrollDisbursementId: run!.id,
        employeeName: item.employeeName,
        employeeRole: item.employeeRole || "",
        grossAmount: item.grossAmount.toString(),
        taxAmount: (item.taxAmount || 0).toString(),
        netAmount: item.netAmount.toString(),
        bankAccount: item.bankAccount || null,
      }));
      await db.insert(payrollDisbursementItems).values(values);
    }

    return NextResponse.json({ success: true, run }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
