import crypto from "crypto";
import { db } from "@/db";
import { oauthAuthorizationCodes } from "@/db/schema/oauth";
import { applications } from "@/db/schema/applications";
import { eq } from "drizzle-orm";
import { generateSecureRandomString } from "../utils";
import { env } from "../env";
import { TokenService } from "./token";
import { auditQueue } from "../redis";
import bcrypt from "bcrypt";

export type AuthCodeValidation =
  | { valid: true; userId: string; applicationId: string; scope: string; codeRecord: typeof oauthAuthorizationCodes.$inferSelect }
  | { valid: false; error: "EXPIRED" | "INVALID" | "ALREADY_USED" | "PKCE_MISMATCH" | "CLIENT_MISMATCH" };

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
}

export class OAuth2Service {
  /**
   * Validate PKCE challenge
   */
  static validatePKCEChallenge(
    codeVerifier: string,
    codeChallenge: string,
    method: "S256" | "plain" | string
  ): boolean {
    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
      return false;
    }

    if (method === "S256") {
      const computedChallenge = crypto
        .createHash("sha256")
        .update(codeVerifier)
        .digest("base64url");
      return computedChallenge === codeChallenge;
    } else if (method === "plain") {
      return codeVerifier === codeChallenge;
    }

    return false;
  }

  /**
   * Generate an authorization code
   */
  static async createAuthorizationCode(params: {
    userId: string;
    applicationId: string;
    redirectUri: string;
    scope: string;
    codeChallenge: string;
    codeChallengeMethod: string;
  }): Promise<{ code: string; expiresAt: Date }> {
    const code = generateSecureRandomString(64);
    const lifespanSeconds = env.AUTHORIZATION_CODE_EXPIRY || 600; // 10 minutes
    const expiresAt = new Date(Date.now() + lifespanSeconds * 1000);

    await db.insert(oauthAuthorizationCodes).values({
      code,
      userId: params.userId,
      applicationId: params.applicationId,
      redirectUri: params.redirectUri,
      scope: params.scope,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      expiresAt,
      used: false,
    });

    return { code, expiresAt };
  }

  /**
   * Validate authorization code and PKCE
   */
  static async validateAuthorizationCode(
    code: string,
    codeVerifier: string,
    clientId: string,
    redirectUri: string
  ): Promise<AuthCodeValidation> {
    const codeList = await db
      .select()
      .from(oauthAuthorizationCodes)
      .where(eq(oauthAuthorizationCodes.code, code))
      .limit(1);

    const codeRecord = codeList[0];
    if (!codeRecord) {
      return { valid: false, error: "INVALID" };
    }

    // Check if client matches
    const appList = await db
      .select()
      .from(applications)
      .where(eq(applications.clientId, clientId))
      .limit(1);
    const app = appList[0];
    if (!app || codeRecord.applicationId !== app.id) {
      return { valid: false, error: "CLIENT_MISMATCH" };
    }

    // Check redirect URI
    if (codeRecord.redirectUri !== redirectUri) {
      console.warn(`[OAuth2] Redirect URI mismatch: CodeRecord="${codeRecord.redirectUri}" vs Request="${redirectUri}"`);
      return { valid: false, error: "INVALID" };
    }

    // Check if already used
    if (codeRecord.used) {
      // Security warning: possible replay attack. Revoke all tokens associated with this user + app
      await TokenService.revokeAllTokensForUserApp(codeRecord.userId, codeRecord.applicationId);
      
      await auditQueue.push({
        actorUserId: codeRecord.userId,
        action: "TOKEN_ISSUED",
        entityType: "authorization_code",
        entityId: codeRecord.id,
        metadata: { success: false, reason: "code_replay_attack" },
      });

      return { valid: false, error: "ALREADY_USED" };
    }

    // Check if expired
    if (new Date() > codeRecord.expiresAt) {
      return { valid: false, error: "EXPIRED" };
    }

    // Check PKCE
    const pkceValid = this.validatePKCEChallenge(
      codeVerifier,
      codeRecord.codeChallenge,
      codeRecord.codeChallengeMethod
    );

    if (!pkceValid) {
      return { valid: false, error: "PKCE_MISMATCH" };
    }

    return {
      valid: true,
      userId: codeRecord.userId,
      applicationId: codeRecord.applicationId,
      scope: codeRecord.scope,
      codeRecord,
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(params: {
    code: string;
    codeVerifier: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }): Promise<TokenResponse> {
    // 1. Validate application
    const appList = await db
      .select()
      .from(applications)
      .where(eq(applications.clientId, params.clientId))
      .limit(1);
    
    const app = appList[0];
    if (!app || app.status !== "active") {
      throw new Error("Invalid or inactive client application");
    }

    // 2. Validate client secret
    const secretValid = await bcrypt.compare(params.clientSecret, app.clientSecretHash);
    if (!secretValid) {
      await auditQueue.push({
        actorUserId: "system",
        action: "LOGIN_FAILURE",
        entityType: "application",
        entityId: app.id,
        metadata: { reason: "invalid_client_secret" },
      });
      throw new Error("Invalid client credentials");
    }

    // 3. Validate authorization code
    const validationResult = await this.validateAuthorizationCode(
      params.code,
      params.codeVerifier,
      params.clientId,
      params.redirectUri
    );

    if (!validationResult.valid) {
      throw new Error(`Authorization code validation failed: ${validationResult.error}`);
    }

    const { userId, applicationId, scope, codeRecord } = validationResult;

    // 4. Mark code as used immediately
    await db
      .update(oauthAuthorizationCodes)
      .set({ used: true })
      .where(eq(oauthAuthorizationCodes.id, codeRecord.id));

    // 5. Issue tokens
    const tokens = await TokenService.issueTokens({
      userId,
      applicationId,
      scope,
    });

    // 6. Audit logging
    await auditQueue.push({
      actorUserId: userId,
      action: "TOKEN_ISSUED",
      entityType: "application",
      entityId: applicationId,
      metadata: {
        scope,
        grantType: "authorization_code",
      },
    });

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      id_token: tokens.idToken,
      token_type: "Bearer",
      expires_in: tokens.expiresIn,
      scope,
    };
  }

  /**
   * Refresh access token using a refresh token
   */
  static async refreshAccessToken(params: {
    refreshToken: string;
    clientId: string;
    clientSecret: string;
  }): Promise<TokenResponse> {
    // 1. Validate application
    const appList = await db
      .select()
      .from(applications)
      .where(eq(applications.clientId, params.clientId))
      .limit(1);
    
    const app = appList[0];
    if (!app || app.status !== "active") {
      throw new Error("Invalid or inactive client application");
    }

    // 2. Validate client secret
    const secretValid = await bcrypt.compare(params.clientSecret, app.clientSecretHash);
    if (!secretValid) {
      throw new Error("Invalid client credentials");
    }

    // 3. Perform Token Service refresh
    const newTokens = await TokenService.refreshAccessToken(params.refreshToken, app.id);

    return {
      access_token: newTokens.accessToken,
      refresh_token: newTokens.refreshToken,
      id_token: newTokens.idToken,
      token_type: "Bearer",
      expires_in: newTokens.expiresIn,
      scope: newTokens.scope,
    };
  }
}
