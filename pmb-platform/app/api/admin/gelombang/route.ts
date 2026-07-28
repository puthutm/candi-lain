import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbWaves } from "@/db/schema/master";
import { desc } from "drizzle-orm";
import { requireRole, PMB_ROLES } from "@/lib/sso-middleware";

export async function GET() {
  try {
    const auth = await requireRole([PMB_ROLES.SUPER_ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const waves = await db
      .select()
      .from(pmbWaves)
      .orderBy(desc(pmbWaves.createdAt));

    return NextResponse.json({ success: true, waves });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireRole([PMB_ROLES.SUPER_ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { name, code, academicPeriodLabel, startDate, endDate, status } = body;

    if (!name || !code || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: "Name, code, startDate, endDate are required" }, { status: 400 });
    }

    const [inserted] = await db
      .insert(pmbWaves)
      .values({
        name,
        code,
        academicPeriodLabel: academicPeriodLabel || "2026/2027 Ganjil",
        startDate,
        endDate,
        status: status || "belum_dibuka",
      })
      .returning();

    return NextResponse.json({ success: true, wave: inserted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export async function PATCH(req: Request) {
  try {
    const auth = await requireRole([PMB_ROLES.SUPER_ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "ID and status are required" }, { status: 400 });
    }

    const { eq } = await import("drizzle-orm");
    const [updated] = await db
      .update(pmbWaves)
      .set({ status })
      .where(eq(pmbWaves.id, id))
      .returning();

    return NextResponse.json({ success: true, wave: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
