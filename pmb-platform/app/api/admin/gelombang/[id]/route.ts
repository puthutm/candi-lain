import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbWaves } from "@/db/schema/master";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookie = (await cookies()).get("pmb_user");
    if (!cookie?.value) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = JSON.parse(cookie.value);
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, code, startDate, endDate, status } = body;

    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (status !== undefined) updateData.status = status;

    const [updated] = await db
      .update(pmbWaves)
      .set(updateData)
      .where(eq(pmbWaves.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Wave not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, wave: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookie = (await cookies()).get("pmb_user");
    if (!cookie?.value) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = JSON.parse(cookie.value);
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
    }

    const { id } = await params;

    // Soft delete — set status to tertutup
    const [updated] = await db
      .update(pmbWaves)
      .set({ status: "tertutup" })
      .where(eq(pmbWaves.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Wave not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Gelombang ditutup", wave: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
