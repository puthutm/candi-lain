import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentInvoices, payments, financeClearanceStatus } from "@/db/schema/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const remoteStudents = pgTable("siakad_students", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id"),
  fullName: text("full_name").notNull(),
  academicStatus: text("academic_status").notNull(),
});

export async function POST(req: Request) {
  let siakadClient;
  try {
    // 1. Validate session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { invoiceId, channel } = body;

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: "invoiceId is required" }, { status: 400 });
    }

    // 2. Fetch invoice details
    const [invoice] = await db
      .select()
      .from(studentInvoices)
      .where(eq(studentInvoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "lunas") {
      return NextResponse.json({ success: false, error: "Invoice is already paid" }, { status: 400 });
    }

    // 3. Mark invoice as paid and record transaction
    await db.transaction(async (tx) => {
      await tx
        .update(studentInvoices)
        .set({
          paidAmount: invoice.totalAmount,
          outstandingAmount: "0.00",
          status: "lunas",
        })
        .where(eq(studentInvoices.id, invoiceId));

      await tx.insert(payments).values({
        invoiceId,
        channel: channel || "virtual_account",
        providerRef: `PAY-SIM-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: invoice.totalAmount,
        status: "success",
        autoReconciled: true,
        paidAt: new Date(),
      });

      await tx
        .update(financeClearanceStatus)
        .set({
          status: "aktif",
          reason: "Lunas pembayaran SPP/UKT",
          updatedAt: new Date(),
        })
        .where(eq(financeClearanceStatus.studentUserId, invoice.studentUserId));
    });

    // 4. Update academic status back to 'aktif' in the siakad_platform database
    const hrisUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/hris_platform";
    const siakadUrl = hrisUrl.replace("/hris_platform", "/siakad_platform").replace("/keuangan_platform", "/siakad_platform");
    
    try {
      siakadClient = postgres(siakadUrl, { prepare: false });
      const siakadDb = drizzle(siakadClient);
      
      await siakadDb
        .update(remoteStudents)
        .set({ academicStatus: "aktif" })
        .where(eq(remoteStudents.userId, invoice.studentUserId));
      console.log(`Updated SIAKAD academicStatus to aktif for user: ${invoice.studentUserId}`);
    } catch (e) {
      console.warn("Could not sync status to siakad_platform database.", e);
    } finally {
      if (siakadClient) {
        await siakadClient.end();
      }
    }

    return NextResponse.json({ success: true, message: "Pembayaran simulasi berhasil diproses!" });
  } catch (error: any) {
    console.error("Simulation pay error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
