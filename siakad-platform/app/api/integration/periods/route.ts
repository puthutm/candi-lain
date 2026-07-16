import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadAcademicPeriods } from "@/db/schema/master";

export async function GET() {
  try {
    const list = await db
      .select({
        id: siakadAcademicPeriods.id,
        name: siakadAcademicPeriods.name,
        status: siakadAcademicPeriods.status,
      })
      .from(siakadAcademicPeriods);

    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
