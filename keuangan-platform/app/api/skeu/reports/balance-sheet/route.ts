import { NextRequest, NextResponse } from "next/server";
import { generateBalanceSheet } from "@/lib/financial-reports";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const asOfDate = searchParams.get("asOfDate") || undefined;

    const report = await generateBalanceSheet(asOfDate);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("[Balance Sheet API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyusun Laporan Neraca" },
      { status: 500 }
    );
  }
}
