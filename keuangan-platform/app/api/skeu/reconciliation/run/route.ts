import { NextRequest, NextResponse } from "next/server";
import { runBankReconciliation } from "@/lib/reconciliation-engine";
import { db } from "@/db";
import { bankAccounts } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { bankAccountId } = body;

    if (!bankAccountId) {
      const accounts = await db.select().from(bankAccounts).limit(1);
      bankAccountId = accounts[0]?.id;
    }

    if (!bankAccountId) {
      return NextResponse.json(
        { success: false, error: "Rekening bank tidak ditemukan" },
        { status: 400 }
      );
    }

    const result = await runBankReconciliation(bankAccountId);

    return NextResponse.json({
      success: true,
      message: `Rekonsiliasi bank selesai! ${result.matchedCount} transaksi berhasil dicocokkan.`,
      result,
    });
  } catch (error: any) {
    console.error("[Bank Reconciliation API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal me-run rekonsiliasi bank" },
      { status: 500 }
    );
  }
}
