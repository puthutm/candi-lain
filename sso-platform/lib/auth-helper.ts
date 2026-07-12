import { cookies } from "next/headers";
import { AuthenticationService } from "@/lib/services/auth";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sso_session")?.value;
  if (!sessionId) return null;

  const check = await AuthenticationService.validateSession(sessionId);
  if (!check.valid || !check.session) return null;

  const userList = await db.select().from(users).where(eq(users.id, check.session.userId)).limit(1);
  const user = userList[0];
  if (!user || user.status !== "active") return null;

  return user;
}

export function isSuperAdmin(user: typeof users.$inferSelect): boolean {
  const adminEmail = env.SUPER_ADMIN_EMAIL || "admin@example.com";
  return user.email === adminEmail;
}
