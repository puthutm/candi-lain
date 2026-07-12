import { db } from "@/db";
import { applications } from "@/db/schema/applications";
import { eq } from "drizzle-orm";
import { generateSecureRandomString, isValidRedirectUri } from "../utils";
import { auditQueue } from "../redis";
import bcrypt from "bcrypt";
import { env } from "../env";

export class ClientService {
  /**
   * Register a new client application
   */
  static async createApplication(params: {
    name: string;
    description?: string;
    redirectUris: string[];
    allowedGrantTypes?: string[];
    logoUrl?: string;
    ownerUserId?: string;
  }): Promise<{ application: typeof applications.$inferSelect; rawSecret: string }> {
    // Validate redirect URIs
    for (const uri of params.redirectUris) {
      if (!isValidRedirectUri(uri)) {
        throw new Error(`Invalid redirect URI: ${uri}. Only HTTPS is allowed, except for localhost/127.0.0.1 which allows HTTP.`);
      }
    }

    // Generate secure client ID (24 chars) and secret (32 chars)
    const clientId = generateSecureRandomString(24);
    const rawSecret = generateSecureRandomString(32);
    
    const saltRounds = env.BCRYPT_ROUNDS || 12;
    const clientSecretHash = await bcrypt.hash(rawSecret, saltRounds);

    const [app] = await db
      .insert(applications)
      .values({
        clientId,
        clientSecretHash,
        name: params.name,
        description: params.description || null,
        redirectUris: params.redirectUris,
        allowedGrantTypes: params.allowedGrantTypes ?? ["authorization_code", "refresh_token"],
        logoUrl: params.logoUrl || null,
        ownerUserId: params.ownerUserId || null,
        status: "active",
      })
      .returning();

    if (!app) {
      throw new Error("Failed to register client application");
    }

    await auditQueue.push({
      actorUserId: params.ownerUserId || "system",
      action: "APPLICATION_CREATED",
      entityType: "application",
      entityId: app.id,
      metadata: { clientId, name: params.name },
    });

    return { application: app, rawSecret };
  }

  /**
   * Update client application details
   */
  static async updateApplication(
    id: string,
    params: {
      name?: string;
      description?: string;
      redirectUris?: string[];
      allowedGrantTypes?: string[];
      logoUrl?: string;
      status?: "active" | "inactive" | string;
    }
  ): Promise<typeof applications.$inferSelect> {
    if (params.redirectUris) {
      for (const uri of params.redirectUris) {
        if (!isValidRedirectUri(uri)) {
          throw new Error(`Invalid redirect URI: ${uri}. Only HTTPS is allowed, except for localhost/127.0.0.1 which allows HTTP.`);
        }
      }
    }

    const [updated] = await db
      .update(applications)
      .set({
        name: params.name,
        description: params.description,
        redirectUris: params.redirectUris,
        allowedGrantTypes: params.allowedGrantTypes,
        logoUrl: params.logoUrl,
        status: params.status,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();

    if (!updated) {
      throw new Error("Application not found");
    }

    await auditQueue.push({
      actorUserId: "system",
      action: "APPLICATION_UPDATED",
      entityType: "application",
      entityId: id,
      metadata: { name: params.name, status: params.status },
    });

    return updated;
  }

  /**
   * Rotate client secret
   */
  static async rotateClientSecret(id: string): Promise<string> {
    const rawSecret = generateSecureRandomString(32);
    const saltRounds = env.BCRYPT_ROUNDS || 12;
    const clientSecretHash = await bcrypt.hash(rawSecret, saltRounds);

    const [updated] = await db
      .update(applications)
      .set({
        clientSecretHash,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();

    if (!updated) {
      throw new Error("Application not found");
    }

    await auditQueue.push({
      actorUserId: "system",
      action: "APPLICATION_UPDATED",
      entityType: "application",
      entityId: id,
      metadata: { action: "secret_rotated" },
    });

    return rawSecret;
  }

  /**
   * Retrieve application by ID
   */
  static async getApplicationById(id: string): Promise<typeof applications.$inferSelect | null> {
    const list = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
    return list[0] || null;
  }

  /**
   * Retrieve application by Client ID
   */
  static async getApplicationByClientId(clientId: string): Promise<typeof applications.$inferSelect | null> {
    const list = await db.select().from(applications).where(eq(applications.clientId, clientId)).limit(1);
    return list[0] || null;
  }
}
