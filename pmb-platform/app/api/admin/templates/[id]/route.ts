import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pmbMessageTemplates } from "@/db/schema/communication";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, triggerEvent, channel, subject, body: templateBody, isActive } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (triggerEvent !== undefined) updateData.triggerEvent = triggerEvent;
    if (channel !== undefined) updateData.channel = channel;
    if (subject !== undefined) updateData.subject = subject;
    if (templateBody !== undefined) updateData.body = templateBody;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updated] = await db
      .update(pmbMessageTemplates)
      .set(updateData)
      .where(eq(pmbMessageTemplates.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[API Templates] Gagal mengupdate template:", error);
    return NextResponse.json({ error: "Gagal mengupdate template" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const [deleted] = await db
      .delete(pmbMessageTemplates)
      .where(eq(pmbMessageTemplates.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ message: "Template berhasil dihapus" });
  } catch (error) {
    console.error("[API Templates] Gagal menghapus template:", error);
    return NextResponse.json({ error: "Gagal menghapus template" }, { status: 500 });
  }
}
