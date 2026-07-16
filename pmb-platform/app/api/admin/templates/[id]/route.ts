import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbMessageTemplates } from "@/db/schema/communication";
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
    const { name, triggerEvent, channel, subject, body: templateBody, isActive } = body;

    const updateData: any = {};
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
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, template: updated });
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

    const deleted = await db
      .delete(pmbMessageTemplates)
      .where(eq(pmbMessageTemplates.id, id))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Template deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
