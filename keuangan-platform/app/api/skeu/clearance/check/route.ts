import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentInvoices } from "@/db/schema/invoices";
import { financeClearanceStatus } from "@/db/schema/clearance";
import { eq, and, sql } from "drizzle-orm";
import { siakadClient } from "@/lib/siakad-client";

export async function POST() {
  try {
    // 1. Find all invoices that are overdue (past due date and still outstanding)
    const now = new Date();
    const overdueInvoices = await db
      .select()
      .from(studentInvoices)
      .where(
        and(
          sql`${studentInvoices.dueDate} < ${now.toISOString().split("T")[0]}`,
          sql`(${studentInvoices.status} = 'outstanding' OR ${studentInvoices.status} = 'overdue')`
        )
      );

    if (overdueInvoices.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No overdue invoices found",
        updated: 0,
      });
    }

    // 2. Update status to overdue

    const studentIds = [...new Set(overdueInvoices.map(inv => inv.studentUserId))];

    // Update invoice statuses in batch
    for (const invoice of overdueInvoices) {
      await db
        .update(studentInvoices)
        .set({
          status: "overdue",
          updatedAt: new Date(),
        })
        .where(eq(studentInvoices.id, invoice.id));
    }

    // 3. Update clearance status for affected students
    const updatedClearances = [];
    for (const studentId of studentIds) {
      // Check if student has other outstanding invoices
      const activeOverdue = await db
        .select({ count: sql<number>`count(*)` })
        .from(studentInvoices)
        .where(
          and(
            eq(studentInvoices.studentUserId, studentId),
            sql`(${studentInvoices.status} = 'outstanding' OR ${studentInvoices.status} = 'overdue')`
          )
        );

      if (Number(activeOverdue[0]?.count || 0) > 0) {
      await db
          .insert(financeClearanceStatus)
          .values({
            studentUserId: studentId,
            status: "tertahan",
            reason: "Terdapat tagihan overdue",
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: financeClearanceStatus.studentUserId,
            set: {
              status: "tertahan",
              reason: "Terdapat tagihan overdue",
              updatedAt: new Date(),
            },
          });

        updatedClearances.push(studentId);

        // Publish event ke SIAKAD
        try {
          await siakadClient.publishClearanceEvent({
            userId: studentId,
            newStatus: "tertahan",
            reason: "Terdapat tagihan overdue",
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          console.error(`[Clearance] Failed to publish event for ${studentId}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${overdueInvoices.length} overdue invoices, updated ${updatedClearances.length} clearances`,
      updated: overdueInvoices.length,
      clearancesUpdated: updatedClearances.length,
    });
  } catch (error: any) {
    console.error("[Clearance Check] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";


