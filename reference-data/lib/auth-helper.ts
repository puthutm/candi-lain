import { cookies } from "next/headers";
import { redis } from "./redis";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sso_session")?.value;
  if (!sessionId) return null;

  const sessionKey = `auth:session:${sessionId}`;
  const sessionData = await redis.get(sessionKey);
  if (!sessionData) return null;

  try {
    const session = JSON.parse(sessionData) as Session;
    
    // Check if session has expired
    if (new Date(session.expiresAt) < new Date()) {
      await redis.del(sessionKey);
      return null;
    }

    const userList = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    const user = userList[0];
    if (!user || user.status !== "active") return null;

    return user;
  } catch (err) {
    console.error("Failed to parse user session:", err);
    return null;
  }
}

export function isSuperAdmin(user: typeof users.$inferSelect): boolean {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@example.com";
  return user.email === adminEmail;
}
