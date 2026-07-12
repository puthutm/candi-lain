import { db } from "@/db";
import { oauthAccessTokens, oauthRefreshTokens } from "@/db/schema/oauth";
import { auditLogs } from "@/db/schema/audit";
import { eq, and, lt } from "drizzle-orm";

/**
 * Cleanup revoked token records older than 90 days
 */
export async function cleanupRevokedTokens(): Promise<number> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const oldTokens = await db
    .select({ id: oauthAccessTokens.id })
    .from(oauthAccessTokens)
    .where(
      and(
        eq(oauthAccessTokens.revoked, true),
        lt(oauthAccessTokens.createdAt, ninetyDaysAgo)
      )
    );

  const ids = oldTokens.map((t) => t.id);
  if (ids.length === 0) return 0;

  let deletedCount = 0;
  await db.transaction(async (tx) => {
    for (const accessTokenId of ids) {
      const res = await tx
        .delete(oauthRefreshTokens)
        .where(eq(oauthRefreshTokens.accessTokenId, accessTokenId))
        .returning();
      deletedCount += res.length;
    }

    for (const id of ids) {
      await tx.delete(oauthAccessTokens).where(eq(oauthAccessTokens.id, id));
    }
  });

  return deletedCount;
}

/**
 * Archive audit logs older than 1 year
 */
export async function archiveOldAuditLogs(): Promise<number> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Soft/Hard delete logs older than 1 year (cold storage export can be added here)
  const deleted = await db
    .delete(auditLogs)
    .where(lt(auditLogs.createdAt, oneYearAgo))
    .returning();

  return deleted.length;
}
