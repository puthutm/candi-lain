import { NextResponse } from "next/server";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const siakadAcademicPeriods = pgTable("siakad_academic_periods", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull(),
});

export async function GET() {
  let siakadClient;
  try {
    const pmbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/pmb_platform";
    const siakadUrl = pmbUrl.replace("/pmb_platform", "/siakad_platform");

    siakadClient = postgres(siakadUrl, { prepare: false });
    const siakadDb = drizzle(siakadClient);

    const periods = await siakadDb
      .select({
        id: siakadAcademicPeriods.id,
        name: siakadAcademicPeriods.name,
        status: siakadAcademicPeriods.status,
      })
      .from(siakadAcademicPeriods);

    if (periods.length > 0) {
      return NextResponse.json({ success: true, periods });
    }
  } catch (error: any) {
    console.warn("Error fetching SIAKAD academic periods:", error.message);
  } finally {
    if (siakadClient) {
      await siakadClient.end();
    }
  }

  // Fallback defaults if DB connection is unavailable
  return NextResponse.json({
    success: true,
    periods: [
      { id: "1", name: "2026/2027 Ganjil", status: "berjalan" },
      { id: "2", name: "2026/2027 Genap", status: "terjadwal" },
      { id: "3", name: "2027/2028 Ganjil", status: "terjadwal" },
      { id: "4", name: "2027/2028 Genap", status: "terjadwal" },
    ],
  });
}

export const dynamic = "force-dynamic";
