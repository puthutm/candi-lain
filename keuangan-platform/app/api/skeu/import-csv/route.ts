import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { tuitionRates } from "@/db/schema/master";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvText } = body;
    if (!csvText) {
      return NextResponse.json({ success: false, error: "csvText is required" }, { status: 400 });
    }

    const lines = csvText.split("\n").map((line: string) => line.trim()).filter((line: string) => line.length > 0);
    if (lines.length <= 1) {
      return NextResponse.json({ success: false, error: "CSV file is empty" }, { status: 400 });
    }

    // Expected format:
    // studyProgramRef,studyProgramNameSnapshot,academicPeriodLabel,sppAmount,bopAmount
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i]!.split(",").map((p: string) => p.trim());
      if (parts.length < 5) continue;

      const studyProgramRef = parts[0]!;
      const studyProgramNameSnapshot = parts[1]!;
      const academicPeriodLabel = parts[2]!;
      const sppAmount = parseFloat(parts[3] || "0");
      const bopAmount = parseFloat(parts[4] || "0");
      const totalAmount = sppAmount + bopAmount;

      if (!studyProgramRef || !studyProgramNameSnapshot || !academicPeriodLabel) continue;

      // Update if exists for the same prodi + period, otherwise insert
      const [existing] = await db
        .select()
        .from(tuitionRates)
        .where(
          and(
            eq(tuitionRates.studyProgramRef, studyProgramRef),
            eq(tuitionRates.academicPeriodLabel, academicPeriodLabel)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(tuitionRates)
          .set({
            studyProgramNameSnapshot,
            sppAmount: sppAmount.toFixed(2),
            bopAmount: bopAmount.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
          })
          .where(eq(tuitionRates.id, existing.id));
      } else {
        await db.insert(tuitionRates).values({
          studyProgramRef,
          studyProgramNameSnapshot,
          academicPeriodLabel,
          sppAmount: sppAmount.toFixed(2),
          bopAmount: bopAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
        });
      }
      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error("CSV import error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
