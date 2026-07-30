import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbFeeRates } from "@/db/schema/pmb";
import { eq, desc } from "drizzle-orm";
import { pgTable, uuid, text, numeric, boolean } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const pmbEntryPaths = pgTable("pmb_entry_paths", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  formFee: numeric("form_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  isFree: boolean("is_free").default(false).notNull(),
});

export async function GET() {
  let pmbClient;
  try {
    let rates = await db
      .select()
      .from(pmbFeeRates)
      .orderBy(desc(pmbFeeRates.createdAt));

    // If rates is empty, dynamically populate from PMB entry paths
    if (rates.length === 0) {
      try {
        const keuanganUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/keuangan_platform";
        const pmbUrl = keuanganUrl.replace("/keuangan_platform", "/pmb_platform");

        pmbClient = postgres(pmbUrl, { prepare: false });
        const pmbDb = drizzle(pmbClient);

        const paths = await pmbDb.select().from(pmbEntryPaths);
        for (const path of paths) {
          const [inserted] = await db
            .insert(pmbFeeRates)
            .values({
              waveLabel: path.name,
              registrationFee: String(path.formFee || 0),
              examFee: "50000.00",
              reregistrationFee: "1500000.00",
              matriculationFee: "500000.00",
            })
            .returning();
          if (inserted) {
            rates.push(inserted);
          }
        }
      } catch (e: any) {
        console.warn("Could not auto-seed from PMB entry paths:", e.message);
      }
    }

    return NextResponse.json({ success: true, rates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (pmbClient) {
      await pmbClient.end();
    }
  }
}

export async function POST(req: Request) {
  let pmbClient;
  try {
    const body = await req.json();
    const { waveLabel, registrationFee, examFee, reregistrationFee, matriculationFee } = body;

    if (!waveLabel) {
      return NextResponse.json({ success: false, error: "waveLabel wajib diisi" }, { status: 400 });
    }

    const regFee = String(registrationFee || 0);

    const [inserted] = await db
      .insert(pmbFeeRates)
      .values({
        waveLabel,
        registrationFee: regFee,
        examFee: String(examFee || 0),
        reregistrationFee: String(reregistrationFee || 0),
        matriculationFee: String(matriculationFee || 0),
      })
      .returning();

    // Cross-sync directly into pmb_platform database
    try {
      const keuanganUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/keuangan_platform";
      const pmbUrl = keuanganUrl.replace("/keuangan_platform", "/pmb_platform");

      pmbClient = postgres(pmbUrl, { prepare: false });
      const pmbDb = drizzle(pmbClient);

      const paths = await pmbDb.select().from(pmbEntryPaths);
      const matched = paths.find((p) => p.name.toLowerCase().includes(waveLabel.toLowerCase()));
      if (matched) {
        await pmbDb
          .update(pmbEntryPaths)
          .set({ formFee: regFee, isFree: Number(regFee) === 0 })
          .where(eq(pmbEntryPaths.id, matched.id));
      }
    } catch (e: any) {
      console.warn("Cross sync to PMB failed:", e.message);
    }

    return NextResponse.json({ success: true, rate: inserted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (pmbClient) {
      await pmbClient.end();
    }
  }
}

export async function PATCH(req: Request) {
  let pmbClient;
  try {
    const body = await req.json();
    const { id, waveLabel, registrationFee, examFee, reregistrationFee, matriculationFee } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "id wajib diisi" }, { status: 400 });
    }

    const updateData: any = {};
    if (waveLabel !== undefined) updateData.waveLabel = waveLabel;
    if (registrationFee !== undefined) updateData.registrationFee = String(registrationFee);
    if (examFee !== undefined) updateData.examFee = String(examFee);
    if (reregistrationFee !== undefined) updateData.reregistrationFee = String(reregistrationFee);
    if (matriculationFee !== undefined) updateData.matriculationFee = String(matriculationFee);

    const [updated] = await db
      .update(pmbFeeRates)
      .set(updateData)
      .where(eq(pmbFeeRates.id, id))
      .returning();

    // Cross-sync directly into pmb_platform database
    if (updated && registrationFee !== undefined) {
      try {
        const keuanganUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/keuangan_platform";
        const pmbUrl = keuanganUrl.replace("/keuangan_platform", "/pmb_platform");

        pmbClient = postgres(pmbUrl, { prepare: false });
        const pmbDb = drizzle(pmbClient);

        const targetLabel = updated.waveLabel;
        const paths = await pmbDb.select().from(pmbEntryPaths);
        const matched = paths.find((p) => p.name.toLowerCase().includes(targetLabel.toLowerCase()));
        if (matched) {
          const regFee = String(registrationFee);
          await pmbDb
            .update(pmbEntryPaths)
            .set({ formFee: regFee, isFree: Number(regFee) === 0 })
            .where(eq(pmbEntryPaths.id, matched.id));
        }
      } catch (e: any) {
        console.warn("Cross sync to PMB failed:", e.message);
      }
    }

    return NextResponse.json({ success: true, rate: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (pmbClient) {
      await pmbClient.end();
    }
  }
}

export const dynamic = "force-dynamic";
