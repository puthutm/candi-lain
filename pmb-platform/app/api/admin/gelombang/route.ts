import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbWaves } from "@/db/schema/master";
import { desc } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookie = (await cookies()).get("pmb_user");
    if (!cookie?.value) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = JSON.parse(cookie.value);
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
    }

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
    const cookie = (await cookies()).get("pmb_user");
    if (!cookie?.value) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = JSON.parse(cookie.value);
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, startDate, endDate, status } = body;

    if (!name || !code || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: "Name, code, startDate, endDate are required" }, { status: 400 });
    }

    const [inserted] = await db
      .insert(pmbWaves)
      .values({
        name,
        code,
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
export const dynamic = "force-dynamic";
