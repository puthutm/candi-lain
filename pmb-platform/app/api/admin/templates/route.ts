import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbMessageTemplates } from "@/db/schema/communication";
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

    const templates = await db
      .select()
      .from(pmbMessageTemplates)
      .orderBy(desc(pmbMessageTemplates.createdAt));

    return NextResponse.json({ success: true, templates });
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
    const { name, triggerEvent, channel, subject, body: templateBody, isActive } = body;

    if (!name || !triggerEvent || !channel || !templateBody) {
      return NextResponse.json({ success: false, error: "name, triggerEvent, channel, body required" }, { status: 400 });
    }

    const [inserted] = await db
      .insert(pmbMessageTemplates)
      .values({
        name,
        triggerEvent,
        channel,
        subject: subject || null,
        body: templateBody,
        isActive: isActive !== false,
      })
      .returning();

    return NextResponse.json({ success: true, template: inserted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
