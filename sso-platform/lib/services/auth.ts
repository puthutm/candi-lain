import bcrypt from "bcrypt";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { redis } from "../redis";
import { env } from "../env";
import { isValidPassword } from "../utils";
import { auditQueue } from "../redis";
import { randomUUID } from "crypto";
import postgres from "postgres";

export type AuthResult =
  | { success: true; user: typeof users.$inferSelect }
  | { success: false; error: "INVALID_CREDENTIALS" | "USER_INACTIVE" | "USER_LOCKED" };

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
}

export class AuthenticationService {
  /**
   * Hashes a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = env.BCRYPT_ROUNDS || 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verifies if raw password matches password hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async authenticate(usernameOrEmail: string, password: string): Promise<AuthResult> {
    // Find user by username, email, NIP, or NIM
    let user = null;
    let searchCondition = eq(users.username, usernameOrEmail);
    if (usernameOrEmail.includes("@")) {
      searchCondition = eq(users.email, usernameOrEmail);
    }
    const directUserList = await db.select().from(users).where(searchCondition).limit(1);
    if (directUserList.length > 0) {
      user = directUserList[0];
    } else {
      // Fallback dynamic database lookups against siakad_platform students or lecturers
      let resolvedUserId: string | null = null;
      let client: any = null;
      try {
        const siakadDbUrl = process.env.DATABASE_URL?.replace("/sso_platform", "/siakad_platform");
        if (siakadDbUrl) {
          client = postgres(siakadDbUrl);
          
          // Check student NIM
          const students = await client`SELECT user_id FROM siakad_students WHERE nim = ${usernameOrEmail} LIMIT 1`;
          if (students.length > 0 && students[0].user_id) {
            resolvedUserId = students[0].user_id;
          } else {
            // Check lecturer NIDN/NIP
            const lecturers = await client`SELECT user_id FROM siakad_lecturers WHERE nidn = ${usernameOrEmail} LIMIT 1`;
            if (lecturers.length > 0 && lecturers[0].user_id) {
              resolvedUserId = lecturers[0].user_id;
            }
          }
        }
      } catch (err) {
        console.error("Error looking up user by SIAKAD NIM/NIP dynamically:", err);
      } finally {
        if (client) {
          await client.end();
        }
      }

      if (resolvedUserId) {
        const list = await db.select().from(users).where(eq(users.id, resolvedUserId)).limit(1);
        if (list.length > 0) {
          user = list[0];
        }
      }
    }

    if (!user) {
      return { success: false, error: "INVALID_CREDENTIALS" };
    }

    // Check if account status is active
    if (user.status === "inactive") {
      return { success: false, error: "USER_INACTIVE" };
    }
    if (user.status === "locked") {
      return { success: false, error: "USER_LOCKED" };
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      // Failed login attempt tracking
      const failedAttemptsKey = `auth:failed_attempts:${user.id}`;
      const failedAttempts = await redis.incr(failedAttemptsKey);

      // Set expiry on failed attempts key to 24 hours
      await redis.expire(failedAttemptsKey, 86400);

      if (failedAttempts >= 5) {
        // Lock user account
        await db
          .update(users)
          .set({ status: "locked", updatedAt: new Date() })
          .where(eq(users.id, user.id));

        await redis.del(failedAttemptsKey);

        // Queue high severity audit event for account lock
        await auditQueue.push({
          actorUserId: user.id,
          action: "ACCOUNT_LOCKED",
          entityType: "user",
          entityId: user.id,
          metadata: { reason: "5_failed_login_attempts" },
        });

        return { success: false, error: "USER_LOCKED" };
      }

      return { success: false, error: "INVALID_CREDENTIALS" };
    }

    // Success: Reset failed login attempts
    await redis.del(`auth:failed_attempts:${user.id}`);

    return { success: true, user };
  }

  /**
   * Create a session for a user and save it in Redis
   */
  static async createSession(
    userId: string,
    metadata?: { userAgent?: string; ipAddress?: string },
    rememberMe?: boolean
  ): Promise<Session> {
    try {
      const sessionId = randomUUID();
      const maxAgeSeconds = rememberMe ? 2592000 : (env.SESSION_MAX_AGE || 86400);

      const now = new Date();
      const expires = new Date(now.getTime() + maxAgeSeconds * 1000);

      const session: Session = {
        id: sessionId,
        userId,
        createdAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
      };

      // Save session in Redis
      const sessionKey = `auth:session:${sessionId}`;
      await redis.set(sessionKey, JSON.stringify(session), "EX", maxAgeSeconds);

      return session;
    } catch (err) {
      console.error("❌ createSession failed", err);
      throw err;
    }
  }

  /**
   * Validate a session by ID
   */
  static async validateSession(sessionId: string): Promise<{ valid: boolean; session?: Session }> {
    const sessionKey = `auth:session:${sessionId}`;
    const sessionData = await redis.get(sessionKey);

    if (!sessionData) {
      return { valid: false };
    }

    const session = JSON.parse(sessionData) as Session;
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (now > expiresAt) {
      await redis.del(sessionKey);
      return { valid: false };
    }

    return { valid: true, session };
  }

  /**
   * Destroy (revoke) a session
   */
  static async destroySession(sessionId: string): Promise<void> {
    const sessionKey = `auth:session:${sessionId}`;
    await redis.del(sessionKey);
  }

  /**
   * Change user password with policy verification and active session invalidation
   */
  static async changePassword(
    userId: string,
    currentPasswordOrAdminKey: string,
    newPassword: string,
    isAdminBypass: boolean = false
  ): Promise<void> {
    // Validate password policy
    if (!isValidPassword(newPassword)) {
      throw new Error("Password does not meet complexity requirements");
    }

    const userList = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userList[0];
    if (!user) {
      throw new Error("User not found");
    }

    if (!isAdminBypass) {
      const isCurrentPasswordValid = await this.verifyPassword(currentPasswordOrAdminKey, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new Error("Incorrect current password");
      }
    }

    // Update password
    const newPasswordHash = await this.hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Invalidate all active sessions for this user in Redis
    let cursor = "0";
    const sessionPattern = "auth:session:*";

    do {
      const [newCursor, keys] = await redis.scan(cursor, "MATCH", sessionPattern, "COUNT", 100);
      cursor = newCursor;

      for (const key of keys) {
        const sessionData = await redis.get(key);
        if (sessionData) {
          const parsed = JSON.parse(sessionData) as Session;
          if (parsed.userId === userId) {
            await redis.del(key);
          }
        }
      }
    } while (cursor !== "0");

    // Queue audit event
    await auditQueue.push({
      actorUserId: userId,
      action: "PASSWORD_CHANGED",
      entityType: "user",
      entityId: userId,
      metadata: { bypass: isAdminBypass },
    });
  }
}
