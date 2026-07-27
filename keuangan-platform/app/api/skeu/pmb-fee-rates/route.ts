import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbFeeRates } from "@/db/schema/pmb";
import { desc } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role === "mahasiswa") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const rates = await db.select().from(pmbFeeRates).orderBy(desc(pmbFeeRates.createdAt));
    return NextResponse.json({ success: true, rates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role === "mahasiswa") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { waveLabel, registrationFee, examFee, reregistrationFee, matriculationFee } = body;

    if (!waveLabel) {
      return NextResponse.json({ success: false, error: "Missing waveLabel" }, { status: 400 });
    }

    const [rate] = await db
      .insert(pmbFeeRates)
      .values({
        waveLabel,
        registrationFee: registrationFee || "0.00",
        examFee: examFee || "0.00",
        reregistrationFee: reregistrationFee || "0.00",
        matriculationFee: matriculationFee || "0.00",
      })
      .returning();

    return NextResponse.json({ success: true, rate }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
