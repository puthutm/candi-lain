import { NextRequest, NextResponse } from "next/server";
import { generateIncomeStatement } from "@/lib/financial-reports";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const report = await generateIncomeStatement(startDate, endDate);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("[Income Statement API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyusun Laporan Laba/Rugi" },
      { status: 500 }
    );
  }
}
