import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbFeeRates } from "@/db/schema/pmb";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const rates = await db
      .select()
      .from(pmbFeeRates)
      .orderBy(desc(pmbFeeRates.createdAt));

    return NextResponse.json({ success: true, rates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { waveLabel, registrationFee, examFee, reregistrationFee, matriculationFee } = body;

    if (!waveLabel) {
      return NextResponse.json({ success: false, error: "waveLabel wajib diisi" }, { status: 400 });
    }

    const [inserted] = await db
      .insert(pmbFeeRates)
      .values({
        waveLabel,
        registrationFee: String(registrationFee || 0),
        examFee: String(examFee || 0),
        reregistrationFee: String(reregistrationFee || 0),
        matriculationFee: String(matriculationFee || 0),
      })
      .returning();

    return NextResponse.json({ success: true, rate: inserted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, waveLabel, registrationFee, examFee, reregistrationFee, matriculationFee } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "id wajib diisi" }, { status: 400 });
    }

    const { eq } = await import("drizzle-orm");
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

    return NextResponse.json({ success: true, rate: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
