import { NextResponse } from "next/server";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { db } from "@/db";
import { pmbStudyPrograms } from "@/db/schema/master";

const siakadStudyPrograms = pgTable("siakad_study_programs", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  faculty: text("faculty").notNull(),
  degreeLevel: text("degree_level").notNull(),
});

export async function GET() {
  let siakadClient;
  try {
    const pmbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/pmb_platform";
    const siakadUrl = pmbUrl.replace("/pmb_platform", "/siakad_platform");

    siakadClient = postgres(siakadUrl, { prepare: false });
    const siakadDb = drizzle(siakadClient);

    const prodis = await siakadDb
      .select({
        id: siakadStudyPrograms.id,
        name: siakadStudyPrograms.name,
        faculty: siakadStudyPrograms.faculty,
        degreeLevel: siakadStudyPrograms.degreeLevel,
      })
      .from(siakadStudyPrograms);

    if (prodis.length > 0) {
      return NextResponse.json({ success: true, studyPrograms: prodis });
    }
  } catch (error: any) {
    console.warn("Could not fetch SIAKAD study programs, falling back to local PMB study programs:", error.message);
  } finally {
    if (siakadClient) {
      await siakadClient.end();
    }
  }

  // Fallback to PMB study programs table or default list
  try {
    const localProdis = await db.select().from(pmbStudyPrograms);
    if (localProdis.length > 0) {
      return NextResponse.json({ success: true, studyPrograms: localProdis });
    }
  } catch (e: any) {
    console.warn("Could not fetch local PMB study programs:", e.message);
  }

  return NextResponse.json({
    success: true,
    studyPrograms: [
      { id: "1", name: "S1 Informatika", faculty: "FTI", degreeLevel: "S1" },
      { id: "2", name: "S1 Sistem Informasi", faculty: "FTI", degreeLevel: "S1" },
      { id: "3", name: "S1 Manajemen", faculty: "FEB", degreeLevel: "S1" },
      { id: "4", name: "S1 Akuntansi", faculty: "FEB", degreeLevel: "S1" },
      { id: "5", name: "S1 Ilmu Komunikasi", faculty: "FIKOM", degreeLevel: "S1" },
    ],
  });
}

export const dynamic = "force-dynamic";
