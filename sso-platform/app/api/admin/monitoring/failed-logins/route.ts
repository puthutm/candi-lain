import { NextResponse } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { db } from "@/db";
import { auditLogs } from "@/db/schema/audit";
import { eq, gte, sql, and } from "drizzle-orm";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "7");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    // Total failed logins in period
    const totalFailedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, "LOGIN_FAILED"),
          gte(auditLogs.createdAt, since)
        )
      );
    const totalFailed = Number(totalFailedResult[0]?.count || 0);

    // Failed logins over time (daily)
    const dailyFailed = await db
      .select({
        date: sql<string>`date_trunc('day', ${auditLogs.createdAt})::text`,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, "LOGIN_FAILED"),
          gte(auditLogs.createdAt, since)
        )
      )
      .groupBy(sql`date_trunc('day', ${auditLogs.createdAt})`)
      .orderBy(sql`date_trunc('day', ${auditLogs.createdAt})`);

    // Top failed users (by metadata email/username)
    const topFailedUsers = await db
      .select({
        metadata: auditLogs.metadata,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, "LOGIN_FAILED"),
          gte(auditLogs.createdAt, since)
        )
      )
      .groupBy(auditLogs.metadata)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    // Recent failed attempts
    const recentFailed = await db
      .select({
        id: auditLogs.id,
        actorUserId: auditLogs.actorUserId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, "LOGIN_FAILED"),
          gte(auditLogs.createdAt, since)
        )
      )
      .orderBy(sql`${auditLogs.createdAt} desc`)
      .limit(20);

    return NextResponse.json({
      totalFailed,
      dailyFailed,
      topFailedUsers,
      recentFailed,
      period: { days, since: since.toISOString() },
    });
  } catch (err: any) {
    console.error("Failed to fetch failed login metrics:", err);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
