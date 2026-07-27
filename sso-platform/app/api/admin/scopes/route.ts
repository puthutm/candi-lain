import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { scopes } from "@/db/schema/applications";
import { eq } from "drizzle-orm";
import { auditQueue } from "@/lib/redis";

export async function GET() {
  try {
    const allScopes = await db.select().from(scopes).orderBy(scopes.code);
    return NextResponse.json(allScopes);
  } catch (err: any) {
    console.error("Failed to fetch scopes:", err);
    return NextResponse.json({ error: "Failed to fetch scopes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, description } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Scope code is required" }, { status: 400 });
    }

    // Validate scope code format (alphanumeric with colons allowed)
    if (!/^[a-zA-Z0-9_:]+$/.test(code)) {
      return NextResponse.json(
        { error: "Scope code must be alphanumeric and may contain underscores and colons" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await db.select().from(scopes).where(eq(scopes.code, code)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: `Scope '${code}' already exists` }, { status: 409 });
    }

    const [insertedScope] = await db
      .insert(scopes)
      .values({
        code,
        description: description || null,
      })
      .returning();

    if (!insertedScope) {
      return NextResponse.json({ error: "Failed to create scope" }, { status: 500 });
    }

    await auditQueue.push({
      actorUserId: "system",
      action: "SCOPE_CREATED",
      entityType: "scope",
      entityId: insertedScope.id,
      metadata: { code },
    });

    return NextResponse.json(insertedScope, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create scope:", err);
    return NextResponse.json({ error: "Failed to create scope" }, { status: 500 });
  }
}
