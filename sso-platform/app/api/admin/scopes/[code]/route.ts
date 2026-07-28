import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { scopes, applicationScopes } from "@/db/schema/applications";
import { eq, sql } from "drizzle-orm";
import { auditQueue } from "@/lib/redis";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const existing = await db.select().from(scopes).where(eq(scopes.code, code)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: `Scope '${code}' not found` }, { status: 404 });
    }

    const scope = existing[0];
    if (!scope) {
      return NextResponse.json({ error: "Scope not found" }, { status: 404 });
    }

    // Check if scope is in use by any application
    const usageResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(applicationScopes)
      .where(eq(applicationScopes.scopeId, scope.id));

    const usageCount = usageResult[0]?.count || 0;
    if (usageCount > 0) {
      return NextResponse.json(
        { error: `Scope '${code}' is in use by ${usageCount} application(s) and cannot be deleted` },
        { status: 409 }
      );
    }

    await db.delete(scopes).where(eq(scopes.id, scope.id));

    await auditQueue.push({
      actorUserId: "system",
      action: "SCOPE_DELETED",
      entityType: "scope",
      entityId: scope.id,
      metadata: { code },
    });

    return NextResponse.json({ message: `Scope '${code}' deleted successfully` });
  } catch (err: any) {
    console.error("Failed to delete scope:", err);
    return NextResponse.json({ error: "Failed to delete scope" }, { status: 500 });
  }
}
