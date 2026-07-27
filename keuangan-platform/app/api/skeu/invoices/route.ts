import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentInvoices, payments } from "@/db/schema/invoices";
import { eq, desc, sql } from "drizzle-orm";
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
    const status = searchParams.get("status");
    const invoiceType = searchParams.get("invoiceType");
    const academicPeriod = searchParams.get("academicPeriod");
    const studentUserId = searchParams.get("studentUserId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where conditions
    const conditions: ReturnType<typeof sql>[] = [];
    if (status) conditions.push(sql`${studentInvoices.status} = ${status}`);
    if (invoiceType) conditions.push(sql`${studentInvoices.invoiceType} = ${invoiceType}`);
    if (academicPeriod) conditions.push(sql`${studentInvoices.academicPeriodLabel} = ${academicPeriod}`);
    if (studentUserId) conditions.push(sql`${studentInvoices.studentUserId} = ${studentUserId}`);

    const whereClause = conditions.length > 0 ? sql`${conditions.join(" AND ")}` : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(studentInvoices)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);
    const offset = (page - 1) * limit;

    // Get paginated results
    const results = await db
      .select({
        invoice: studentInvoices,
        payment: payments,
      })
      .from(studentInvoices)
      .leftJoin(payments, eq(payments.invoiceId, studentInvoices.id))
      .where(whereClause)
      .orderBy(desc(studentInvoices.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      invoices: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
