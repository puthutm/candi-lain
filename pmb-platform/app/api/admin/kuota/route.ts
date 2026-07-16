import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbQuotas } from "@/db/schema/master";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("pmb_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

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
export const dynamic = "force-dynamic";
