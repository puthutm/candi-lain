import * as jose from "jose";
import crypto from "crypto";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { applications } from "@/db/schema/applications";
import { oauthAccessTokens, oauthRefreshTokens } from "@/db/schema/oauth";
import { userApplicationRoles, applicationRoles } from "@/db/schema/rbac";
import { eq, and } from "drizzle-orm";
import { env } from "../env";
import { auditQueue } from "../redis";

let cachedPrivateKey: any = null;
let cachedPublicKey: any = null;
let activeKid = "sso-key-1";
let keysForJwks: any[] = [];

async function getSigningKeys() {
  if (cachedPrivateKey && cachedPublicKey) {
    return { privateKey: cachedPrivateKey, publicKey: cachedPublicKey, kid: activeKid };
  }

  // Load from environment if available
  if (env.JWT_PRIVATE_KEY && env.JWT_PUBLIC_KEY) {
    try {
      const privKeyStr = env.JWT_PRIVATE_KEY.replace(/\\n/g, "\n");
      const pubKeyStr = env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");
      cachedPrivateKey = await jose.importPKCS8(privKeyStr, "RS256");
      cachedPublicKey = await jose.importSPKI(pubKeyStr, "RS256");

      const jwk = await jose.exportJWK(cachedPublicKey);
      keysForJwks = [
        {
          kid: activeKid,
          use: "sig",
          alg: "RS256",
          kty: "RSA",
          ...jwk,
        },
      ];

      return { privateKey: cachedPrivateKey, publicKey: cachedPublicKey, kid: activeKid };
    } catch (err) {
      console.error("Error importing keys from env, falling back to dynamic generation:", err);
    }
  }

  // Fallback to dynamic key generation for local development
  console.log("Generating temporary RS256 key pair for development...");
  const { privateKey, publicKey } = await jose.generateKeyPair("RS256", {
    modulusLength: 2048,
  });

  cachedPrivateKey = privateKey;
  cachedPublicKey = publicKey;

  const jwk = await jose.exportJWK(publicKey);
  keysForJwks = [
    {
      kid: activeKid,
      use: "sig",
      alg: "RS256",
      kty: "RSA",
      ...jwk,
    },
  ];

  return { privateKey, publicKey, kid: activeKid };
}

export class TokenService {
  /**
   * Return JWKS (JSON Web Key Set) public keys
   */
  static async getJWKS() {
    await getSigningKeys();
    return { keys: keysForJwks };
  }

  /**
   * Helper to hash an opaque token
   */
  static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Issue Access, Refresh, and ID tokens for a user and application
   */
  static async issueTokens(params: {
    userId: string;
    applicationId: string;
    scope: string;
  }): Promise<{ accessToken: string; refreshToken: string; idToken: string; expiresIn: number }> {
    const { privateKey, kid } = await getSigningKeys();
    
    // 1. Fetch application details
    const appList = await db
      .select()
      .from(applications)
      .where(eq(applications.id, params.applicationId))
      .limit(1);
    const app = appList[0];
    if (!app) throw new Error("Application not found");

    // 2. Fetch user details
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);
    const user = userList[0];
    if (!user) throw new Error("User not found");

    // 3. Fetch active user application roles
    const rolesList = await db
      .select({
        roleKey: applicationRoles.roleKey,
      })
      .from(userApplicationRoles)
      .innerJoin(applicationRoles, eq(userApplicationRoles.roleId, applicationRoles.id))
      .where(
        and(
          eq(userApplicationRoles.userId, params.userId),
          eq(userApplicationRoles.applicationId, params.applicationId),
          eq(userApplicationRoles.status, "active")
        )
      );

    const roles = rolesList.map(r => r.roleKey);

    const issuer = env.JWT_ISSUER;
    const jti = crypto.randomUUID();
    
    // Access Token Expiry (1 hour default)
    const accessTokenExpiry = env.ACCESS_TOKEN_EXPIRY || 3600;
    
    // 4. Generate Access Token JWT (RS256)
    const accessTokenJwt = await new jose.SignJWT({
      sub: params.userId,
      aud: app.clientId,
      scope: params.scope,
      jti,
    })
      .setProtectedHeader({ alg: "RS256", kid })
      .setIssuedAt()
      .setIssuer(issuer)
      .setExpirationTime(`${accessTokenExpiry}s`)
      .sign(privateKey);

    // 5. Generate ID Token JWT (RS256)
    const idTokenJwt = await new jose.SignJWT({
      sub: params.userId,
      aud: app.clientId,
      name: user.fullName,
      email: user.email,
      preferred_username: user.username,
      roles,
    })
      .setProtectedHeader({ alg: "RS256", kid })
      .setIssuedAt()
      .setIssuer(issuer)
      .setExpirationTime(`${env.ID_TOKEN_EXPIRY || 3600}s`)
      .sign(privateKey);

    // 6. Generate Refresh Token (Opaque 32-char string)
    const rawRefreshToken = crypto.randomBytes(32).toString("hex");
    const refreshLifespan = env.REFRESH_TOKEN_EXPIRY || 2592000; // 30 days
    const refreshExpiresAt = new Date(Date.now() + refreshLifespan * 1000);

    // Save tokens in database
    const accessTokenHash = this.hashToken(accessTokenJwt);
    const refreshTokenHash = this.hashToken(rawRefreshToken);

    await db.transaction(async (tx) => {
      const [insertedAccessToken] = await tx
        .insert(oauthAccessTokens)
        .values({
          tokenHash: accessTokenHash,
          userId: params.userId,
          applicationId: params.applicationId,
          scope: params.scope,
          expiresAt: new Date(Date.now() + accessTokenExpiry * 1000),
          revoked: false,
        })
        .returning();

      if (!insertedAccessToken) {
        throw new Error("Failed to insert access token");
      }

      await tx.insert(oauthRefreshTokens).values({
        tokenHash: refreshTokenHash,
        accessTokenId: insertedAccessToken.id,
        expiresAt: refreshExpiresAt,
        revoked: false,
      });
    });

    return {
      accessToken: accessTokenJwt,
      refreshToken: rawRefreshToken,
      idToken: idTokenJwt,
      expiresIn: accessTokenExpiry,
    };
  }

  /**
   * Verify and decode access token JWT
   */
  static async verifyAccessToken(token: string): Promise<jose.JWTPayload | null> {
    const { publicKey } = await getSigningKeys();

    try {
      const issuer = env.JWT_ISSUER;
      const { payload } = await jose.jwtVerify(token, publicKey, {
        issuer,
      });

      // Check database to ensure it hasn't been revoked
      const tokenHash = this.hashToken(token);
      const tokenList = await db
        .select()
        .from(oauthAccessTokens)
        .where(eq(oauthAccessTokens.tokenHash, tokenHash))
        .limit(1);

      const dbToken = tokenList[0];
      if (!dbToken || dbToken.revoked || new Date() > dbToken.expiresAt) {
        return null;
      }

      return payload;
    } catch (err) {
      console.error("JWT Verification failed:", err);
      return null;
    }
  }

  /**
   * Introspect token status and metadata (used by external apps/resource servers)
   */
  static async introspectToken(token: string): Promise<{
    active: boolean;
    scope?: string;
    client_id?: string;
    username?: string;
    token_type?: "Bearer";
    exp?: number;
    iat?: number;
    sub?: string;
  }> {
    const payload = await this.verifyAccessToken(token);
    if (!payload) {
      return { active: false };
    }

    // Retrieve username for context
    const userList = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, payload.sub || ""))
      .limit(1);
    
    const user = userList[0];

    return {
      active: true,
      scope: payload.scope as string,
      client_id: payload.aud as string,
      username: user?.username,
      token_type: "Bearer",
      exp: payload.exp,
      iat: payload.iat,
      sub: payload.sub,
    };
  }

  /**
   * Revoke an access token
   */
  static async revokeAccessToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await db
      .update(oauthAccessTokens)
      .set({ revoked: true })
      .where(eq(oauthAccessTokens.tokenHash, tokenHash));
  }

  /**
   * Revoke a refresh token (and cascadingly the associated access token)
   */
  static async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    
    const refreshList = await db
      .select()
      .from(oauthRefreshTokens)
      .where(eq(oauthRefreshTokens.tokenHash, tokenHash))
      .limit(1);

    const refreshToken = refreshList[0];
    if (!refreshToken) return;

    await db.transaction(async (tx) => {
      // Revoke refresh token
      await tx
        .update(oauthRefreshTokens)
        .set({ revoked: true })
        .where(eq(oauthRefreshTokens.id, refreshToken.id));

      // Revoke associated access token
      await tx
        .update(oauthAccessTokens)
        .set({ revoked: true })
        .where(eq(oauthAccessTokens.id, refreshToken.accessTokenId));
    });
  }

  /**
   * Revoke all tokens for a user and application (e.g. on client revoke, password change, replay attack)
   */
  static async revokeAllTokensForUserApp(userId: string, applicationId: string): Promise<void> {
    const accessTokens = await db
      .select({ id: oauthAccessTokens.id })
      .from(oauthAccessTokens)
      .where(
        and(
          eq(oauthAccessTokens.userId, userId),
          eq(oauthAccessTokens.applicationId, applicationId),
          eq(oauthAccessTokens.revoked, false)
        )
      );

    const tokenIds = accessTokens.map(t => t.id);
    if (tokenIds.length === 0) return;

    await db.transaction(async (tx) => {
      // Revoke all access tokens
      await tx
        .update(oauthAccessTokens)
        .set({ revoked: true })
        .where(
          and(
            eq(oauthAccessTokens.userId, userId),
            eq(oauthAccessTokens.applicationId, applicationId)
          )
        );

      // Revoke associated refresh tokens
      for (const accessTokenId of tokenIds) {
        await tx
          .update(oauthRefreshTokens)
          .set({ revoked: true })
          .where(eq(oauthRefreshTokens.accessTokenId, accessTokenId));
      }
    });

    await auditQueue.push({
      actorUserId: userId,
      action: "TOKEN_REVOKED",
      entityType: "application",
      entityId: applicationId,
      metadata: { reason: "cascade_revocation_user_app" },
    });
  }

  /**
   * Refresh token flow: validates refresh token, revokes it, and issues new rotated access/refresh tokens
   */
  static async refreshAccessToken(
    rawRefreshToken: string,
    applicationId: string
  ): Promise<{ accessToken: string; refreshToken: string; idToken: string; expiresIn: number; scope: string }> {
    const refreshTokenHash = this.hashToken(rawRefreshToken);

    // 1. Fetch refresh token record with associated access token details
    const refreshList = await db
      .select({
        id: oauthRefreshTokens.id,
        accessTokenId: oauthRefreshTokens.accessTokenId,
        expiresAt: oauthRefreshTokens.expiresAt,
        revoked: oauthRefreshTokens.revoked,
        userId: oauthAccessTokens.userId,
        scope: oauthAccessTokens.scope,
        appId: oauthAccessTokens.applicationId,
      })
      .from(oauthRefreshTokens)
      .innerJoin(oauthAccessTokens, eq(oauthRefreshTokens.accessTokenId, oauthAccessTokens.id))
      .where(eq(oauthRefreshTokens.tokenHash, refreshTokenHash))
      .limit(1);

    const refreshTokenRecord = refreshList[0];
    if (!refreshTokenRecord) {
      throw new Error("Invalid refresh token");
    }

    // Security Check: is token revoked or expired?
    if (refreshTokenRecord.revoked) {
      // Breach detection: refresh token reuse. Revoke all active tokens for that user-application context
      await this.revokeAllTokensForUserApp(refreshTokenRecord.userId, refreshTokenRecord.appId);
      throw new Error("Refresh token already used or revoked");
    }

    if (new Date() > refreshTokenRecord.expiresAt) {
      throw new Error("Refresh token expired");
    }

    // Verify application matching
    if (refreshTokenRecord.appId !== applicationId) {
      throw new Error("Refresh token client mismatch");
    }

    // 2. Perform rotation: revoke old refresh token and access token
    await db.transaction(async (tx) => {
      await tx
        .update(oauthRefreshTokens)
        .set({ revoked: true })
        .where(eq(oauthRefreshTokens.id, refreshTokenRecord.id));

      await tx
        .update(oauthAccessTokens)
        .set({ revoked: true })
        .where(eq(oauthAccessTokens.id, refreshTokenRecord.accessTokenId));
    });

    // 3. Issue new tokens
    const newTokens = await this.issueTokens({
      userId: refreshTokenRecord.userId,
      applicationId: refreshTokenRecord.appId,
      scope: refreshTokenRecord.scope,
    });

    return {
      ...newTokens,
      scope: refreshTokenRecord.scope,
    };
  }

  /**
   * Retrieve OIDC User Profile Information using access token payload
   */
  static async getUserInfo(accessTokenPayload: jose.JWTPayload, applicationId: string): Promise<{
    sub: string;
    email: string;
    email_verified: boolean;
    name: string;
    preferred_username: string;
    roles: string[];
  }> {
    const userId = accessTokenPayload.sub;
    if (!userId) throw new Error("Invalid token payload");

    // Fetch user
    const userList = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userList[0];
    if (!user || user.status !== "active") {
      throw new Error("User not found or inactive");
    }

    // Fetch user roles for the requesting application
    const rolesList = await db
      .select({
        roleKey: applicationRoles.roleKey,
      })
      .from(userApplicationRoles)
      .innerJoin(applicationRoles, eq(userApplicationRoles.roleId, applicationRoles.id))
      .where(
        and(
          eq(userApplicationRoles.userId, userId),
          eq(userApplicationRoles.applicationId, applicationId),
          eq(userApplicationRoles.status, "active")
        )
      );

    return {
      sub: userId,
      email: user.email,
      email_verified: true, // Local accounts verified by default
      name: user.fullName,
      preferred_username: user.username,
      roles: rolesList.map(r => r.roleKey),
    };
  }
}
