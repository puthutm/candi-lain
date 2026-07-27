import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pmbMessageTemplates } from "@/db/schema/communication";

export async function GET() {
  try {
    const templates = await db.select().from(pmbMessageTemplates).orderBy(pmbMessageTemplates.name);
    return NextResponse.json(templates);
  } catch (error) {
    console.error("[API Templates] Gagal mengambil template:", error);
    return NextResponse.json({ error: "Gagal mengambil template" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, triggerEvent, channel, subject, body: templateBody, isActive } = body;

    if (!name || !triggerEvent || !channel) {
      return NextResponse.json({ error: "Nama, trigger event, dan channel wajib diisi" }, { status: 400 });
    }

    const [template] = await db.insert(pmbMessageTemplates).values({
      name,
      triggerEvent,
      channel,
      subject: subject || null,
      body: templateBody || "",
      isActive: isActive ?? true,
    }).returning();

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("[API Templates] Gagal membuat template:", error);
    return NextResponse.json({ error: "Gagal membuat template" }, { status: 500 });
  }
}
