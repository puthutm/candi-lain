import { NextResponse } from "next/server";
import { db } from "@/db";
import { tuitionRates } from "@/db/schema/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

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
    const { studyProgramRef, studyProgramNameSnapshot, academicPeriodLabel, sppAmount, bopAmount, requiresYayasanApproval } = body;

    if (!studyProgramRef || !studyProgramNameSnapshot || !academicPeriodLabel || !sppAmount || !bopAmount) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const spp = parseFloat(sppAmount);
    const bop = parseFloat(bopAmount);
    const total = spp + bop;

    const [inserted] = await db.insert(tuitionRates).values({
      studyProgramRef,
      studyProgramNameSnapshot,
      academicPeriodLabel,
      sppAmount: spp.toFixed(2),
      bopAmount: bop.toFixed(2),
      totalAmount: total.toFixed(2),
      requiresYayasanApproval: !!requiresYayasanApproval,
    }).returning();

    return NextResponse.json({ success: true, tuitionRate: inserted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
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
    const { id, sppAmount, bopAmount, requiresYayasanApproval } = body;

    if (!id || !sppAmount || !bopAmount) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const spp = parseFloat(sppAmount);
    const bop = parseFloat(bopAmount);
    const total = spp + bop;

    const [updated] = await db.update(tuitionRates)
      .set({
        sppAmount: spp.toFixed(2),
        bopAmount: bop.toFixed(2),
        totalAmount: total.toFixed(2),
        requiresYayasanApproval: !!requiresYayasanApproval,
      })
      .where(eq(tuitionRates.id, id))
      .returning();

    return NextResponse.json({ success: true, tuitionRate: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
