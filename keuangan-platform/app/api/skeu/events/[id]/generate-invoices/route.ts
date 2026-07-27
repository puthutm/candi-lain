import { NextResponse } from "next/server";
import { db } from "@/db";
import { paidEvents, eventFeeComponents, eventRegistrations } from "@/db/schema/events";
import { studentInvoices, studentInvoiceItems } from "@/db/schema/invoices";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * FR-5.3: Generate tagihan massal ke peserta event (mis. wisudawan)
 * POST /api/skeu/events/[id]/generate-invoices
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Get pending registrations
    const registrations = await db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, id));

    const pending = registrations.filter(r => r.status === "terdaftar" && !r.invoiceId);
    if (pending.length === 0) {
      return NextResponse.json({ success: true, message: "No pending registrations to invoice" });
    }

    // Get fee components for this event
    const feeComponents = await db.select().from(eventFeeComponents).where(eq(eventFeeComponents.eventId, id));
    const totalFee = feeComponents.reduce((sum, fc) => sum + parseFloat(fc.amount), 0);

    const generated: Array<{ studentUserId: string; invoiceId: string }> = [];

    for (const reg of pending) {
      const invoiceNumber = `INV/${event.name.replace(/\s+/g, "")}/${reg.studentUserId.slice(0, 8).toUpperCase()}/${Date.now()}`;

      const [invoice] = await db
        .insert(studentInvoices)
        .values({
          studentUserId: reg.studentUserId,
          invoiceNumber,
          invoiceType: event.eventType === "wisuda" ? "wisuda" : "lainnya",
          academicPeriodLabel: `${event.startDate || "TBD"} - ${event.endDate || "TBD"}`,
          totalAmount: totalFee.toFixed(2),
          paidAmount: "0.00",
          outstandingAmount: totalFee.toFixed(2),
          status: "outstanding",
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]!,
        })
        .returning();

      // Create invoice items from fee components
      for (const fc of feeComponents) {
        await db.insert(studentInvoiceItems).values({
          invoiceId: invoice!.id,
          componentName: fc.componentName,
          amount: fc.amount,
        });
      }

      // Update registration with invoice reference
      await db
        .update(eventRegistrations)
        .set({ invoiceId: invoice!.id })
        .where(eq(eventRegistrations.id, reg.id));

      generated.push({ studentUserId: reg.studentUserId, invoiceId: invoice!.id });
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generated.length} invoices for ${event.name}`,
      generated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
