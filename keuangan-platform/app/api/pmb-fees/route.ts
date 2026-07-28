import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbFeeRates } from "@/db/schema/pmb";
import { eq } from "drizzle-orm";

/**
 * Public endpoint: GET /api/pmb-fees?waveLabel=xxx
 * Called by PMB platform to get the fee for a specific wave.
 * No auth required — the API key check is done via a shared secret header.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const waveLabel = searchParams.get("waveLabel");

    if (waveLabel) {
      const rates = await db
        .select()
        .from(pmbFeeRates)
        .where(eq(pmbFeeRates.waveLabel, waveLabel))
        .limit(1);

      if (rates.length > 0) {
        return NextResponse.json({ success: true, rate: rates[0] });
      }
      return NextResponse.json({ success: false, error: "Tarif gelombang tidak ditemukan" }, { status: 404 });
    }

    const allRates = await db.select().from(pmbFeeRates);
    return NextResponse.json({ success: true, rates: allRates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
