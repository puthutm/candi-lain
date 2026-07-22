import { NextResponse } from "next/server";
import { redis, auditQueue } from "@/lib/redis";
import { getAdminSession } from "@/lib/auth-helper";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { inArray } from "drizzle-orm";

export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const keys = await redis.keys("auth:session:*");
    const sessionsList: any[] = [];

    if (keys.length > 0) {
      const rawSessions = await redis.mget(...keys);
      const userIdsSet = new Set<string>();

      rawSessions.forEach((data) => {
        if (data) {
          try {
            const parsed = JSON.parse(data);
            userIdsSet.add(parsed.userId);
          } catch {
            // ignore
          }
        }
      });

      const userIds = Array.from(userIdsSet);
      let userMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const userRows = await db
          .select({
            id: users.id,
            fullName: users.fullName,
            email: users.email,
            username: users.username,
          })
          .from(users)
          .where(inArray(users.id, userIds));

        userRows.forEach((u) => {
          userMap[u.id] = u;
        });
      }

      rawSessions.forEach((data) => {
        if (data) {
          try {
            const sessionObj = JSON.parse(data);
            const userObj = userMap[sessionObj.userId] || {
              fullName: "Unknown User",
              email: "-",
              username: "-",
            };
            sessionsList.push({
              id: sessionObj.id,
              userId: sessionObj.userId,
              userName: userObj.fullName,
              userEmail: userObj.email,
              username: userObj.username,
              createdAt: sessionObj.createdAt,
              expiresAt: sessionObj.expiresAt,
              userAgent: sessionObj.userAgent || "Unknown Device",
              ipAddress: sessionObj.ipAddress || "-",
            });
          } catch {
            // ignore
          }
        }
      });
    }

    return NextResponse.json({ success: true, list: sessionsList });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "sessionId is required" }, { status: 400 });
    }

    const sessionKey = `auth:session:${sessionId}`;
    await redis.del(sessionKey);

    await auditQueue.push({
      actorUserId: adminSession.userId,
      action: "SESSION_REMOTE_KILLED",
      entityType: "session",
      entityId: sessionId,
      metadata: { revokedBy: adminSession.name },
    });

    return NextResponse.json({ success: true, message: "Session revoked successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
