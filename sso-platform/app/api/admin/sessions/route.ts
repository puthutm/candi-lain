import { NextResponse, type NextRequest } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const sessions: Array<{
      sessionId: string;
      userId: string;
      createdAt: string;
      expiresAt: string;
      userAgent?: string;
      ipAddress?: string;
    }> = [];

    let cursor = "0";
    const sessionPattern = "auth:session:*";

    do {
      const [newCursor, keys] = await redis.scan(cursor, "MATCH", sessionPattern, "COUNT", 100);
      cursor = newCursor;

      for (const key of keys) {
        const sessionData = await redis.get(key);
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            
            // Filter by userId if provided
            if (userId && parsed.userId !== userId) continue;

            const sessionId = key.replace("auth:session:", "");
            sessions.push({
              sessionId,
              userId: parsed.userId,
              createdAt: parsed.createdAt,
              expiresAt: parsed.expiresAt,
              userAgent: parsed.userAgent,
              ipAddress: parsed.ipAddress,
            });
          } catch {
            // Skip invalid session data
          }
        }
      }
    } while (cursor !== "0");

    // Sort by createdAt descending (newest first)
    sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply limit
    const limitedSessions = sessions.slice(0, limit);

    return NextResponse.json({
      sessions: limitedSessions,
      total: sessions.length,
      returned: limitedSessions.length,
    });
  } catch (err: any) {
    console.error("Failed to fetch sessions:", err);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId } = body;

    if (!sessionId && !userId) {
      return NextResponse.json(
        { error: "Provide sessionId or userId to revoke sessions" },
        { status: 400 }
      );
    }

    let revokedCount = 0;

    if (sessionId) {
      // Revoke specific session
      const sessionKey = `auth:session:${sessionId}`;
      const deleted = await redis.del(sessionKey);
      if (deleted > 0) revokedCount++;
    } else if (userId) {
      // Revoke all sessions for a user
      let cursor = "0";
      const sessionPattern = "auth:session:*";

      do {
        const [newCursor, keys] = await redis.scan(cursor, "MATCH", sessionPattern, "COUNT", 100);
        cursor = newCursor;

        for (const key of keys) {
          const sessionData = await redis.get(key);
          if (sessionData) {
            try {
              const parsed = JSON.parse(sessionData);
              if (parsed.userId === userId) {
                await redis.del(key);
                revokedCount++;
              }
            } catch {
              // Skip invalid session data
            }
          }
        }
      } while (cursor !== "0");
    }

    return NextResponse.json({
      message: `Successfully revoked ${revokedCount} session(s)`,
      revokedCount,
    });
  } catch (err: any) {
    console.error("Failed to revoke sessions:", err);
    return NextResponse.json({ error: "Failed to revoke sessions" }, { status: 500 });
  }
}
