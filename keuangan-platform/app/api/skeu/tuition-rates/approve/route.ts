import { NextResponse } from "next/server";
import { db } from "@/db";
import { tuitionRates } from "@/db/schema/master";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

// POST: Approve or reject tuition rate change by Yayasan / Kepala Biro Keuangan
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { rateId, status, notes } = await req.json();

    if (!rateId || !status) {
      return NextResponse.json({ success: false, error: "Rate ID dan status persetujuan wajib diisi" }, { status: 400 });
    }

    if (status !== "disetujui" && status !== "ditolak") {
      return NextResponse.json({ success: false, error: "Status persetujuan tidak valid" }, { status: 400 });
    }

    const [updatedRate] = await db
      .update(tuitionRates)
      .set({
        approvalStatus: status,
        approvalNote: notes || (status === "disetujui" ? "Tarif disetujui oleh Yayasan." : "Tarif ditolak."),
        approvedAt: new Date(),
      })
      .where(eq(tuitionRates.id, rateId))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Perubahan tarif SPP/UKT berhasil di-${status}!`,
      rate: updatedRate,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
