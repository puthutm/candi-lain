import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbWaves, pmbEntryPaths, pmbStudyPrograms, pmbQuotas } from "@/db/schema/master";
import { ensurePmbSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const refCategories = pgTable("ref_categories", {
  id: uuid("id").primaryKey(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
});

const refItems = pgTable("ref_items", {
  id: uuid("id").primaryKey(),
  categoryId: uuid("category_id").notNull(),
  parentId: uuid("parent_id"),
  code: text("code").notNull(),
  name: text("name").notNull(),
});

export async function GET() {
  let refClient;
  try {
    await ensurePmbSeeded();
    const waves = await db.select().from(pmbWaves);
    const entryPaths = await db.select().from(pmbEntryPaths);
    const studyPrograms = await db.select().from(pmbStudyPrograms);

    const quotas = await db
      .select({
        id: pmbQuotas.id,
        waveId: pmbQuotas.waveId,
        studyProgramId: pmbQuotas.studyProgramId,
        quotaTotal: pmbQuotas.quotaTotal,
        quotaFilled: pmbQuotas.quotaFilled,
        studyProgramName: pmbStudyPrograms.name,
      })
      .from(pmbQuotas)
      .leftJoin(pmbStudyPrograms, eq(pmbQuotas.studyProgramId, pmbStudyPrograms.id));

    // Dynamic reference data pull from reference_data database
    const pmbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/pmb_platform";
    const refUrl = pmbUrl.replace("/pmb_platform", "/reference_data");
    
    let regions: Record<string, string[]> = {};
    try {
      refClient = postgres(refUrl, { prepare: false });
      const refDb = drizzle(refClient);
      
      const cats = await refDb.select().from(refCategories);
      const items = await refDb.select().from(refItems);
      
      const provCat = cats.find(c => c.code === "PROVINSI");
      const kotaCat = cats.find(c => c.code === "KOTA");
      
      if (provCat && kotaCat) {
        const provinces = items.filter(i => i.categoryId === provCat.id);
        const cities = items.filter(i => i.categoryId === kotaCat.id);
        
        for (const prov of provinces) {
          const provCities = cities.filter(c => c.parentId === prov.id).map(c => c.name);
          regions[prov.name] = provCities;
        }
      }
    } catch (e) {
      console.warn("Could not load regions from reference-data, using fallback.", e);
      regions = {
        "DKI Jakarta": ["Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur", "Kepulauan Seribu"],
        "Jawa Barat": ["Bandung", "Bogor", "Depok", "Bekasi", "Cimahi", "Tasikmalaya", "Cirebon", "Sukabumi", "Garut"],
        "Banten": ["Tangerang", "Tangerang Selatan", "Serang", "Cilegon", "Pandeglang", "Lebak"]
      };
    }

    return NextResponse.json({
      success: true,
      waves,
      entryPaths,
      studyPrograms,
      quotas,
      regions
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (refClient) {
      await refClient.end();
    }
  }
}
export const dynamic = "force-dynamic";
