import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siakadKrs, siakadKrsItems, siakadKrsApprovals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { krsId, dosenPaId, action, note } = body;

    if (!krsId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "krsId dan action ('approve'|'reject') wajib diisi" },
        { status: 400 }
      );
    }

    if (action === "reject" && !note) {
      return NextResponse.json(
        { success: false, error: "Catatan alasan wajib diisi saat menolak KRS" },
        { status: 400 }
      );
    }

    const [krs] = await db.select().from(siakadKrs).where(eq(siakadKrs.id, krsId));

    if (!krs) {
      return NextResponse.json(
        { success: false, error: "KRS tidak ditemukan" },
        { status: 404 }
      );
    }

    const newStatus = action === "approve" ? "disetujui_pa" : "ditolak";

    // Update KRS status
    await db
      .update(siakadKrs)
      .set({ status: newStatus })
      .where(eq(siakadKrs.id, krsId));

    // Update items status
    await db
      .update(siakadKrsItems)
      .set({ status: action === "approve" ? "disetujui" : "ditolak" })
      .where(eq(siakadKrsItems.krsId, krsId));

    // Insert approval log if dosenPaId is provided
    if (dosenPaId) {
      await db.insert(siakadKrsApprovals).values({
        krsId,
        dosenPaId,
        action,
        note: note || (action === "approve" ? "Disetujui oleh Pembimbing Akademik" : ""),
      });
    }

    return NextResponse.json({
      success: true,
      message: `KRS berhasil di-${action === "approve" ? "setujui" : "tolak"}!`,
      krsId,
      status: newStatus,
    });
  } catch (error: any) {
    console.error("[KRS Approve Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses approval KRS" },
      { status: 500 }
    );
  }
}
