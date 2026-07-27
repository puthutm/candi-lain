import { NextResponse } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { db } from "@/db";
import { oauthAccessTokens } from "@/db/schema/oauth";
import { applications } from "@/db/schema/applications";
import { eq, gte, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "7");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    // Total active tokens
    const activeTokensResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(oauthAccessTokens)
      .where(
        sql`${oauthAccessTokens.expiresAt} > now() AND ${oauthAccessTokens.revoked} = false`
      );
    const activeTokens = Number(activeTokensResult[0]?.count || 0);

    // Tokens issued per application
    const tokensPerApp = await db
      .select({
        appId: oauthAccessTokens.applicationId,
        appName: applications.name,
        count: sql<number>`count(*)`,
      })
      .from(oauthAccessTokens)
      .innerJoin(applications, eq(oauthAccessTokens.applicationId, applications.id))
      .where(gte(oauthAccessTokens.createdAt, since))
      .groupBy(oauthAccessTokens.applicationId, applications.name)
      .orderBy(sql`count(*) desc`);

    // Token usage over time (daily)
    const dailyUsage = await db
      .select({
        date: sql<string>`date_trunc('day', ${oauthAccessTokens.createdAt})::text`,
        count: sql<number>`count(*)`,
      })
      .from(oauthAccessTokens)
      .where(gte(oauthAccessTokens.createdAt, since))
      .groupBy(sql`date_trunc('day', ${oauthAccessTokens.createdAt})`)
      .orderBy(sql`date_trunc('day', ${oauthAccessTokens.createdAt})`);

    // Revoked tokens count
    const revokedTokensResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(oauthAccessTokens)
      .where(
        sql`${oauthAccessTokens.revoked} = true AND ${oauthAccessTokens.createdAt} >= ${since}`
      );
    const revokedTokens = Number(revokedTokensResult[0]?.count || 0);

    return NextResponse.json({
      activeTokens,
      revokedTokens,
      tokensPerApp,
      dailyUsage,
      period: { days, since: since.toISOString() },
    });
  } catch (err: any) {
    console.error("Failed to fetch token usage metrics:", err);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
