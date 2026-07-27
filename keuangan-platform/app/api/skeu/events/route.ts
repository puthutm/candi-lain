import { NextResponse } from "next/server";
import { db } from "@/db";
import { paidEvents, eventFeeComponents } from "@/db/schema/events";
import { desc } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * FR-5.1: CRUD Event Wisuda & Kegiatan Berbayar
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const events = await db.select().from(paidEvents).orderBy(desc(paidEvents.createdAt));
    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, eventType, targetRevenue, estimatedCost, startDate, endDate, notes, feeComponents } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Missing event name" }, { status: 400 });
    }

    const projSurplus = (parseFloat(targetRevenue || "0") - parseFloat(estimatedCost || "0")).toFixed(2);

    const [event] = await db
      .insert(paidEvents)
      .values({
        name,
        eventType: eventType || "wisuda",
        targetRevenue: targetRevenue || "0.00",
        estimatedCost: estimatedCost || "0.00",
        projectedSurplus: projSurplus,
        status: "draf",
        startDate: startDate || null,
        endDate: endDate || null,
        notes,
      })
      .returning();

    // Create fee components if provided
    if (Array.isArray(feeComponents) && feeComponents.length > 0) {
      await db.insert(eventFeeComponents).values(
        feeComponents.map((fc: any) => ({
          eventId: event!.id,
          componentName: fc.componentName,
          amount: fc.amount,
          description: fc.description || null,
        }))
      );
    }

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
