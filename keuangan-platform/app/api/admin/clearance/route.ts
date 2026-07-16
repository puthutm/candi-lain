import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentInvoices, financeClearanceStatus } from "@/db/schema/schema";
import { eq, and, lt } from "drizzle-orm";
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

export async function POST() {
  let siakadClient;
  try {
    // 1. Validate session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role === "mahasiswa") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // 2. Query overdue unpaid invoices
    const todayStr = new Date().toISOString().split("T")[0]!;
    const overdueInvoices = await db
      .select()
      .from(studentInvoices)
      .where(
        and(
          eq(studentInvoices.status, "outstanding"),
          lt(studentInvoices.dueDate, todayStr)
        )
      );

    if (overdueInvoices.length === 0) {
      return NextResponse.json({ success: true, message: "Tidak ada tunggakan jatuh tempo yang terdeteksi.", blockedCount: 0 });
    }

    // 3. Connect to siakad_platform database
    const hrisUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/hris_platform";
    const siakadUrl = hrisUrl.replace("/hris_platform", "/siakad_platform").replace("/keuangan_platform", "/siakad_platform");
    
    siakadClient = postgres(siakadUrl, { prepare: false });
    const siakadDb = drizzle(siakadClient);

    let blockedCount = 0;

    for (const inv of overdueInvoices) {
      // Update local clearance status to 'tertahan'
      await db
        .insert(financeClearanceStatus)
        .values({
          studentUserId: inv.studentUserId,
          status: "tertahan",
          reason: `Tunggakan tagihan ${inv.invoiceNumber} jatuh tempo pada ${inv.dueDate}`,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: financeClearanceStatus.studentUserId,
          set: {
            status: "tertahan",
            reason: `Tunggakan tagihan ${inv.invoiceNumber} jatuh tempo pada ${inv.dueDate}`,
            updatedAt: new Date(),
          }
        });

      // Update student academic status back to 'cuti' in central SIAKAD database
      try {
        await siakadDb
          .update(remoteStudents)
          .set({ academicStatus: "cuti" })
          .where(eq(remoteStudents.userId, inv.studentUserId));
        blockedCount++;
      } catch (e) {
        console.warn(`Failed to block student ${inv.studentUserId} in SIAKAD:`, e);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pengecekan selesai! ${blockedCount} mahasiswa ditangguhkan akibat tunggakan jatuh tempo.`,
      blockedCount,
    });

  } catch (error: any) {
    console.error("Clearance job error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (siakadClient) {
      await siakadClient.end();
    }
  }
}
export const dynamic = "force-dynamic";
