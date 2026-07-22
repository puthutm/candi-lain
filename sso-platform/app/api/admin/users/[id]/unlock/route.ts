import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { redis, auditQueue } from "@/lib/redis";
import { getAdminSession } from "@/lib/auth-helper";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Update user status back to active
    await db
      .update(users)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(users.id, id));

    // Clear failed attempts counter in Redis
    await redis.del(`auth:failed_attempts:${id}`);

    // Log audit event
    await auditQueue.push({
      actorUserId: adminSession.userId,
      action: "ACCOUNT_UNLOCKED_BY_ADMIN",
      entityType: "user",
      entityId: id,
      metadata: { unlockedBy: adminSession.name },
    });

    return NextResponse.json({ success: true, message: "User account unlocked successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
