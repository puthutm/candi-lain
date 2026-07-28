import { NextResponse } from "next/server";
import { db } from "@/db";
import { externalHonorariums } from "@/db/schema/expenditure";
import { desc } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const list = await db.select().from(externalHonorariums).orderBy(desc(externalHonorariums.createdAt));
    return NextResponse.json({ success: true, list });
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
    const { payeeName, payeeNpwp, payeeBankAccount, category, activityDescription, grossAmount, taxType, approvedBy } = body;

    if (!payeeName || !category || !activityDescription || !grossAmount) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const gross = Number(grossAmount);
    if (isNaN(gross) || gross <= 0) {
      return NextResponse.json({ success: false, error: "Invalid gross amount" }, { status: 400 });
    }

    const taxRates: Record<string, number> = { pph21: 0.05, pph23: 0.02, pph42: 0.1, none: 0 };
    const taxRate = Number(taxRates[taxType] || 0);
    const taxAmount = gross * taxRate;
    const netAmount = gross - taxAmount;

    const [record] = await db.insert(externalHonorariums).values({
      payeeName,
      payeeNpwp: payeeNpwp || null,
      payeeBankAccount: payeeBankAccount || null,
      category,
      activityDescription,
      grossAmount: gross.toFixed(2),
      taxType: taxType || "none",
      taxRate: taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      netAmount: netAmount.toFixed(2),
      status: approvedBy ? "disetujui" : "draf",
      approvedBy: approvedBy || null,
    }).returning();

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
