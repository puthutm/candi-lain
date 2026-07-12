import { db } from "@/db";
import { oauthConsents } from "@/db/schema/oauth";
import { applications } from "@/db/schema/applications";
import { eq, and, isNull } from "drizzle-orm";
import { TokenService } from "./token";
import { auditQueue } from "../redis";
import { parseScopes, joinScopes } from "../utils";

export class ConsentService {
  /**
   * Grant consent for a user on an application with specific scopes
   */
  static async grantConsent(userId: string, applicationId: string, scopes: string[]): Promise<typeof oauthConsents.$inferSelect> {
    const spaceSeparatedScopes = joinScopes(scopes);

    // Check if consent record already exists
    const existingList = await db
      .select()
      .from(oauthConsents)
      .where(
        and(
          eq(oauthConsents.userId, userId),
          eq(oauthConsents.applicationId, applicationId)
        )
      )
      .limit(1);

    const existing = existingList[0];
    let result: typeof oauthConsents.$inferSelect;

    if (existing) {
      // Merge scopes: ensure all new scopes are added to existing ones
      const existingScopes = parseScopes(existing.scope);
      const mergedScopes = Array.from(new Set([...existingScopes, ...scopes]));
      
      const [updated] = await db
        .update(oauthConsents)
        .set({
          scope: joinScopes(mergedScopes),
          revokedAt: null, // Reactivate if it was revoked
          grantedAt: new Date(),
        })
        .where(eq(oauthConsents.id, existing.id))
        .returning();

      if (!updated) throw new Error("Failed to update consent");
      result = updated;
    } else {
      // Create new consent record
      const [inserted] = await db
        .insert(oauthConsents)
        .values({
          userId,
          applicationId,
          scope: spaceSeparatedScopes,
          grantedAt: new Date(),
        })
        .returning();

      if (!inserted) throw new Error("Failed to create consent");
      result = inserted;
    }

    await auditQueue.push({
      actorUserId: userId,
      action: "CONSENT_GRANTED",
      entityType: "application",
      entityId: applicationId,
      metadata: { scope: spaceSeparatedScopes },
    });

    return result;
  }

  /**
   * Check if a user has active consent for specific scopes on an application
   */
  static async hasActiveConsent(userId: string, applicationId: string, requestedScopes: string[]): Promise<boolean> {
    const consentList = await db
      .select()
      .from(oauthConsents)
      .where(
        and(
          eq(oauthConsents.userId, userId),
          eq(oauthConsents.applicationId, applicationId),
          isNull(oauthConsents.revokedAt)
        )
      )
      .limit(1);

    const consent = consentList[0];
    if (!consent) return false;

    const grantedScopes = parseScopes(consent.scope);
    
    // Check if every requested scope is granted
    return requestedScopes.every((scope) => grantedScopes.includes(scope));
  }

  /**
   * Revoke consent for a user on an application (and revoke active user-app tokens)
   */
  static async revokeConsent(userId: string, applicationId: string): Promise<void> {
    const consentList = await db
      .select()
      .from(oauthConsents)
      .where(
        and(
          eq(oauthConsents.userId, userId),
          eq(oauthConsents.applicationId, applicationId),
          isNull(oauthConsents.revokedAt)
        )
      )
      .limit(1);

    const consent = consentList[0];
    if (!consent) return;

    await db.transaction(async (tx) => {
      // Mark consent revoked
      await tx
        .update(oauthConsents)
        .set({ revokedAt: new Date() })
        .where(eq(oauthConsents.id, consent.id));

      // Cascade revocation of access & refresh tokens
      await TokenService.revokeAllTokensForUserApp(userId, applicationId);
    });

    await auditQueue.push({
      actorUserId: userId,
      action: "CONSENT_REVOKED",
      entityType: "application",
      entityId: applicationId,
      metadata: {},
    });
  }

  /**
   * Fetch all active consents for a user, including application details
   */
  static async getUserConsents(userId: string): Promise<Array<{
    consentId: string;
    applicationId: string;
    applicationName: string;
    applicationLogo: string | null;
    scopes: string[];
    grantedAt: Date;
  }>> {
    const list = await db
      .select({
        consentId: oauthConsents.id,
        applicationId: oauthConsents.applicationId,
        applicationName: applications.name,
        applicationLogo: applications.logoUrl,
        scope: oauthConsents.scope,
        grantedAt: oauthConsents.grantedAt,
      })
      .from(oauthConsents)
      .innerJoin(applications, eq(oauthConsents.applicationId, applications.id))
      .where(
        and(
          eq(oauthConsents.userId, userId),
          isNull(oauthConsents.revokedAt)
        )
      );

    return list.map((item) => ({
      consentId: item.consentId,
      applicationId: item.applicationId,
      applicationName: item.applicationName,
      applicationLogo: item.applicationLogo,
      scopes: parseScopes(item.scope),
      grantedAt: item.grantedAt,
    }));
  }
}
