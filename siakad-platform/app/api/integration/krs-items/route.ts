import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadKrsItems, siakadKrs } from "@/db/schema/krs";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const academicPeriodId = searchParams.get("academicPeriodId");
    const status = (searchParams.get("status") || "disetujui_pa") as "draft" | "diajukan" | "disetujui_pa" | "ditolak";

    if (!academicPeriodId) {
      return NextResponse.json({ error: "academicPeriodId query parameter is required" }, { status: 400 });
    }

    const list = await db
      .select({
        krsItemId: siakadKrsItems.id,
        classId: siakadKrsItems.classId,
        studentId: siakadKrs.studentId,
      })
      .from(siakadKrsItems)
      .innerJoin(siakadKrs, eq(siakadKrsItems.krsId, siakadKrs.id))
      .where(
        and(
          eq(siakadKrs.academicPeriodId, academicPeriodId),
          eq(siakadKrs.status, status)
        )
      );

    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
