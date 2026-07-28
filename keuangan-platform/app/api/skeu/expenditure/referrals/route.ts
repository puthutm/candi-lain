import { NextResponse } from "next/server";
import { db } from "@/db";
import { referralDisbursements } from "@/db/schema/expenditure";
import { desc } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const list = await db.select().from(referralDisbursements).orderBy(desc(referralDisbursements.createdAt));
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
    const { agentName, agentIdSnapshot, period, totalReferrals, ratePerReferral, taxType, approvedBy } = body;

    if (!agentName || !agentIdSnapshot || !period || !totalReferrals || !ratePerReferral) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const total = Number(totalReferrals) * Number(ratePerReferral);
    const taxRates: Record<string, number> = { pph21: 0.05, pph23: 0.02, pph42: 0.1, none: 0 };
    const taxRate = Number(taxRates[taxType] || 0);
    const taxAmount = total * taxRate;
    const netAmount = total - taxAmount;

    const [record] = await db.insert(referralDisbursements).values({
      agentName,
      agentIdSnapshot,
      period,
      totalReferrals: totalReferrals.toString(),
      ratePerReferral: ratePerReferral.toString(),
      grossAmount: total.toFixed(2),
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
