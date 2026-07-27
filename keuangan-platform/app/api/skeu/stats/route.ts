import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentInvoices, payments } from "@/db/schema/invoices";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const academicPeriod = searchParams.get("academicPeriod");

    // Base conditions
    const periodCondition = academicPeriod 
      ? sql`${studentInvoices.academicPeriodLabel} = ${academicPeriod}`
      : sql`1=1`;

    // 1. Collection Rate Summary
    const invoiceStats = await db
      .select({
        totalInvoices: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${studentInvoices.totalAmount}::numeric)`,
        totalPaid: sql<number>`sum(${studentInvoices.paidAmount}::numeric)`,
        totalOutstanding: sql<number>`sum(${studentInvoices.outstandingAmount}::numeric)`,
        lunasCount: sql<number>`sum(case when ${studentInvoices.status} = 'lunas' then 1 else 0 end)`,
        outstandingCount: sql<number>`sum(case when ${studentInvoices.status} = 'outstanding' then 1 else 0 end)`,
        overdueCount: sql<number>`sum(case when ${studentInvoices.status} = 'overdue' then 1 else 0 end)`,
        cicilanCount: sql<number>`sum(case when ${studentInvoices.status} = 'cicilan' then 1 else 0 end)`,
      })
      .from(studentInvoices)
      .where(sql`${periodCondition}`);

    const stats = invoiceStats[0] || {
      totalInvoices: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      lunasCount: 0,
      outstandingCount: 0,
      overdueCount: 0,
      cicilanCount: 0,
    };

    const collectionRate = stats.totalAmount > 0
      ? ((Number(stats.totalPaid) / Number(stats.totalAmount)) * 100).toFixed(1)
      : "0.0";

    // 2. Payment Channel Distribution
    const channelStats = await db
      .select({
        channel: payments.channel,
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${payments.amount}::numeric)`,
      })
      .from(payments)
      .where(eq(payments.status, "success"))
      .groupBy(payments.channel);

    // 3. Monthly Income Trend (last 6 months)
    const monthlyIncome = await db
      .select({
        month: sql<string>`to_char(${payments.paidAt}, 'YYYY-MM')`,
        totalAmount: sql<number>`sum(${payments.amount}::numeric)`,
      })
      .from(payments)
      .where(eq(payments.status, "success"))
      .groupBy(sql`to_char(${payments.paidAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${payments.paidAt}, 'YYYY-MM')`)
      .limit(6);

    // 4. Aging Summary
    const agingSummary = await db
      .select({
        range: sql<string>`
          case 
            when ${studentInvoices.dueDate} < now() - interval '90 days' then '90+ hari'
            when ${studentInvoices.dueDate} < now() - interval '60 days' then '61-90 hari'
            when ${studentInvoices.dueDate} < now() - interval '30 days' then '31-60 hari'
            when ${studentInvoices.dueDate} < now() then '0-30 hari'
            else 'belum jatuh tempo'
          end
        `,
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${studentInvoices.outstandingAmount}::numeric)`,
      })
      .from(studentInvoices)
      .where(
        sql`${periodCondition} AND (${studentInvoices.status} = 'outstanding' OR ${studentInvoices.status} = 'overdue')`
      )
      .groupBy(sql`
        case 
          when ${studentInvoices.dueDate} < now() - interval '90 days' then '90+ hari'
          when ${studentInvoices.dueDate} < now() - interval '60 days' then '61-90 hari'
          when ${studentInvoices.dueDate} < now() - interval '30 days' then '31-60 hari'
          when ${studentInvoices.dueDate} < now() then '0-30 hari'
          else 'belum jatuh tempo'
        end
      `);

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        collectionRate: parseFloat(collectionRate),
      },
      channelStats,
      monthlyIncome,
      agingSummary,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
