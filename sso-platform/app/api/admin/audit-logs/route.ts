import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { db } from "@/db";
import { auditLogs } from "@/db/schema/audit";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isSuperAdmin(sessionUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    
    const limit = Number(searchParams.get("limit")) || 25;
    const offset = Number(searchParams.get("offset")) || 0;

    const conditions = [];

    if (action) conditions.push(eq(auditLogs.action, action));
    if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
    
    if (startDateStr) {
      conditions.push(gte(auditLogs.createdAt, new Date(startDateStr)));
    }
    if (endDateStr) {
      conditions.push(lte(auditLogs.createdAt, new Date(endDateStr)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get count
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(auditLogs);
    if (whereClause) countQuery.where(whereClause);
    const [countResult] = await countQuery;
    const total = Number(countResult?.count ?? 0);

    // Get data
    const dataQuery = db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
      
    if (whereClause) dataQuery.where(whereClause);
    const logs = await dataQuery;

    return NextResponse.json({ success: true, logs, total });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
