import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants, pmbFeeRates } from "@/db/schema/pmb";
import { sql } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * FR-3.1: Ringkasan Funnel PMB per Gelombang
 * GET /api/skeu/pmb/funnel
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Funnel stats per wave
    const funnelStats = await db
      .select({
        waveLabel: pmbApplicants.waveLabel,
        total: sql<number>`count(*)`,
        pendaftar: sql<number>`sum(case when ${pmbApplicants.registrationStatus} = 'pendaftar' then 1 else 0 end)`,
        bayarFormulir: sql<number>`sum(case when ${pmbApplicants.registrationStatus} = 'bayar_formulir' then 1 else 0 end)`,
        ikutUjian: sql<number>`sum(case when ${pmbApplicants.registrationStatus} = 'ikut_ujian' then 1 else 0 end)`,
        lulusSeleksi: sql<number>`sum(case when ${pmbApplicants.registrationStatus} = 'lulus_seleksi' then 1 else 0 end)`,
        daftarUlang: sql<number>`sum(case when ${pmbApplicants.registrationStatus} = 'daftar_ulang' then 1 else 0 end)`,
      })
      .from(pmbApplicants)
      .groupBy(pmbApplicants.waveLabel);

    const feeRates = await db.select().from(pmbFeeRates);

    return NextResponse.json({ success: true, funnelStats, feeRates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
