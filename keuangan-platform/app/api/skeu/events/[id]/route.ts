import { NextResponse } from "next/server";
import { db } from "@/db";
import { paidEvents, eventFeeComponents, eventRegistrations } from "@/db/schema/events";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [event] = await db.select().from(paidEvents).where(eq(paidEvents.id, id));
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    const feeComponents = await db.select().from(eventFeeComponents).where(eq(eventFeeComponents.eventId, id));
    const registrations = await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, id));

    return NextResponse.json({ success: true, event, feeComponents, registrations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const [updated] = await db
      .update(paidEvents)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(paidEvents.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [deleted] = await db.delete(paidEvents).where(eq(paidEvents.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, event: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
