import { NextResponse } from "next/server";
import { db } from "@/db";
import { applications } from "@/db/schema/applications";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { getAdminSession } from "@/lib/auth-helper";
import { auditQueue } from "@/lib/redis";
import { env } from "@/lib/env";

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

    const appList = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
    const app = appList[0];
    if (!app) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    // Generate new raw client secret
    const rawSecret = `sec_${app.clientId}_${crypto.randomBytes(16).toString("hex")}`;
    const saltRounds = env.BCRYPT_ROUNDS || 12;
    const secretHash = await bcrypt.hash(rawSecret, saltRounds);

    // Update in DB
    await db
      .update(applications)
      .set({
        clientSecretHash: secretHash,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id));

    // Audit log
    await auditQueue.push({
      actorUserId: adminSession.userId,
      action: "CLIENT_SECRET_REGENERATED",
      entityType: "application",
      entityId: id,
      metadata: { clientId: app.clientId, regeneratedBy: adminSession.name },
    });

    return NextResponse.json({
      success: true,
      clientId: app.clientId,
      clientSecret: rawSecret,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
