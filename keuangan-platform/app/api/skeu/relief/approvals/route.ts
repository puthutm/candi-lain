import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentInvoices } from "@/db/schema/invoices";
import { installmentPlans } from "@/db/schema/installment";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * FR-4.5: Approval Pengajuan Keringanan oleh Admin
 * GET  /api/skeu/relief/approvals — list semua pengajuan
 * POST /api/skeu/relief/approvals — approve/tolak pengajuan
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const plans = await db
      .select()
      .from(installmentPlans)
      .orderBy(installmentPlans.createdAt);

    return NextResponse.json({ success: true, plans });
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
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role === "mahasiswa") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { planId, action } = body;

    if (!planId || !action || !["disetujui", "ditolak"].includes(action)) {
      return NextResponse.json({ success: false, error: "Missing required fields: planId, action (disetujui/ditolak)" }, { status: 400 });
    }

    const [plan] = await db.select().from(installmentPlans).where(eq(installmentPlans.id, planId)).limit(1);
    if (!plan) {
      return NextResponse.json({ success: false, error: "Installment plan not found" }, { status: 404 });
    }

    if (plan.status !== "diajukan") {
      return NextResponse.json({ success: false, error: `Plan is already ${plan.status}` }, { status: 400 });
    }

    const now = new Date();

    if (action === "disetujui") {
      // Approve: update plan status to berjalan
      await db
        .update(installmentPlans)
        .set({
          status: "berjalan",
          approvedByUserId: sessionUser.userId,
          approvedAt: now,
          updatedAt: now,
        })
        .where(eq(installmentPlans.id, planId));

      // Update invoice status to cicilan
      const [invoice] = await db.select().from(studentInvoices).where(eq(studentInvoices.id, plan.invoiceId)).limit(1);
      if (invoice && invoice.status !== "lunas") {
        await db
          .update(studentInvoices)
          .set({
            status: "cicilan",
            updatedAt: now,
          })
          .where(eq(studentInvoices.id, plan.invoiceId));
      }

      return NextResponse.json({ success: true, message: "Installment plan approved", planId });
    } else {
      // Reject
      await db
        .update(installmentPlans)
        .set({
          status: "ditolak",
          updatedAt: now,
        })
        .where(eq(installmentPlans.id, planId));

      return NextResponse.json({ success: true, message: "Installment plan rejected", planId });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
