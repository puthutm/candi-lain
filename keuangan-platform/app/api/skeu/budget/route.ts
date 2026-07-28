import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { budgetAllocations } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db
      .select()
      .from(budgetAllocations)
      .orderBy(desc(budgetAllocations.createdAt));

    return NextResponse.json({
      success: true,
      budgets: list,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { unitClusterName, fiscalYear, approvedBudget } = body;

    if (!unitClusterName || !fiscalYear || !approvedBudget) {
      return NextResponse.json(
        { success: false, error: "unitClusterName, fiscalYear, dan approvedBudget wajib diisi" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(budgetAllocations)
      .values({
        unitClusterName,
        fiscalYear: String(fiscalYear),
        approvedBudget: String(approvedBudget),
        realizedAmount: "0.00",
        yayasanApprovedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: `Pagu anggaran unit ${unitClusterName} T.A ${fiscalYear} berhasil disimpan & disetujui Yayasan!`,
      budget: created,
    });
  } catch (error: any) {
    console.error("[Budget API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan pagu anggaran" },
      { status: 500 }
    );
  }
}
