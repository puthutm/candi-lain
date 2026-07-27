import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbQuotas } from "@/db/schema/master";
import { eq } from "drizzle-orm";
import { requireRole, PMB_ROLES } from "@/lib/sso-middleware";

export async function POST(req: Request) {
  try {
    const auth = await requireRole([PMB_ROLES.SUPER_ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { waveId, studyProgramId, quotaTotal } = body;

    if (!waveId || !studyProgramId || quotaTotal === undefined || quotaTotal < 0) {
      return NextResponse.json({ success: false, error: "waveId, studyProgramId, dan quotaTotal wajib diisi" }, { status: 400 });
    }

    const [inserted] = await db
      .insert(pmbQuotas)
      .values({
        waveId,
        studyProgramId,
        quotaTotal,
        quotaFilled: 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Kuota berhasil ditambahkan!",
      quota: inserted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireRole([PMB_ROLES.SUPER_ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const { quotaId, quotaTotal } = await req.json();

    if (!quotaId || quotaTotal === undefined || quotaTotal < 0) {
      return NextResponse.json({ success: false, error: "ID kuota dan jumlah total kuota yang valid wajib diisi" }, { status: 400 });
    }

    const updated = await db
      .update(pmbQuotas)
      .set({ quotaTotal })
      .where(eq(pmbQuotas.id, quotaId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ success: false, error: "Kuota tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Kuota berhasil diperbarui!",
      quota: updated[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireRole([PMB_ROLES.SUPER_ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const quotaId = searchParams.get("quotaId");

    if (!quotaId) {
      return NextResponse.json({ success: false, error: "Parameter quotaId wajib diisi" }, { status: 400 });
    }

    const deleted = await db
      .delete(pmbQuotas)
      .where(eq(pmbQuotas.id, quotaId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ success: false, error: "Kuota tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Kuota berhasil dihapus!",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
