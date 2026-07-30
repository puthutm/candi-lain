import { NextResponse } from "next/server";
import { pgTable, uuid, text, numeric } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { db } from "@/db";
import { pmbEntryPaths } from "@/db/schema/master";
import { eq } from "drizzle-orm";

const pmbFeeRates = pgTable("pmb_fee_rates", {
  id: uuid("id").primaryKey(),
  waveLabel: text("wave_label").notNull(),
  registrationFee: numeric("registration_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  examFee: numeric("exam_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  reregistrationFee: numeric("reregistration_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
});

export async function GET() {
  return POST();
}

export async function POST() {
  let keuanganClient;
  try {
    const pmbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/pmb_platform";
    const keuanganUrl = pmbUrl.replace("/pmb_platform", "/keuangan_platform");

    keuanganClient = postgres(keuanganUrl, { prepare: false });
    const keuanganDb = drizzle(keuanganClient);

    const rates = await keuanganDb.select().from(pmbFeeRates);

    if (rates.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Belum ada tarif pendaftaran khusus di Keuangan. Tarif default PMB digunakan.",
        syncedCount: 0,
      });
    }

    let updatedCount = 0;
    const paths = await db.select().from(pmbEntryPaths);

    for (const rate of rates) {
      // Find matching entry path by waveLabel or name
      const matched = paths.find(
        (p) =>
          p.name.toLowerCase().includes(rate.waveLabel.toLowerCase()) ||
          p.code.toLowerCase().includes(rate.waveLabel.toLowerCase())
      );

      if (matched) {
        const regFee = String(rate.registrationFee || 0);
        await db
          .update(pmbEntryPaths)
          .set({
            formFee: regFee,
            isFree: Number(regFee) === 0,
          })
          .where(eq(pmbEntryPaths.id, matched.id));
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menyingkronkan ${updatedCount} tarif biaya pendaftaran dari Modul Keuangan!`,
      syncedCount: updatedCount,
      rates,
    });
  } catch (error: any) {
    console.warn("Could not sync fees from Keuangan:", error.message);
    return NextResponse.json(
      { success: false, error: "Gagal menghubungkan ke database Keuangan: " + error.message },
      { status: 500 }
    );
  } finally {
    if (keuanganClient) {
      await keuanganClient.end();
    }
  }
}

export const dynamic = "force-dynamic";
