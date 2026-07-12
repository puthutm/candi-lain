import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbWaves, pmbEntryPaths, pmbStudyPrograms } from "@/db/schema/master";
import { ensurePmbSeeded } from "@/db/seed";

export async function GET() {
  try {
    await ensurePmbSeeded();
    const waves = await db.select().from(pmbWaves);
    const entryPaths = await db.select().from(pmbEntryPaths);
    const studyPrograms = await db.select().from(pmbStudyPrograms);

    return NextResponse.json({
      success: true,
      waves,
      entryPaths,
      studyPrograms,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
