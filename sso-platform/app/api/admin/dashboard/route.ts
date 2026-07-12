import { NextResponse } from "next/server";
import { db } from "@/db";
import { applications } from "@/db/schema/applications";
import { users } from "@/db/schema/users";
import { refCategories } from "@/db/schema/reference";
import { AuditService } from "@/lib/services/audit";
import { sql } from "drizzle-orm";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isSuperAdmin(sessionUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [appCountResult] = await db.select({ count: sql<number>`count(*)` }).from(applications);
    const [userCountResult] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [catCountResult] = await db.select({ count: sql<number>`count(*)` }).from(refCategories);

    const totalApps = appCountResult?.count ?? 0;
    const totalUsers = userCountResult?.count ?? 0;
    const totalCategories = catCountResult?.count ?? 0;

    const recentLogs = await AuditService.query({ limit: 5 });
    const usersList = await db.select().from(users).limit(10);

    return NextResponse.json({
      success: true,
      totalApps,
      totalUsers,
      totalCategories,
      recentLogs,
      usersList,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
