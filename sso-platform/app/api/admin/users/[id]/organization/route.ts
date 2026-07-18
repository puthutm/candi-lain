import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";
import { db } from "@/db";
import { userOrganizations, organizations, refItems } from "@/db/schema/reference";
import { eq, and } from "drizzle-orm";

async function verifyAccess() {
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user)) {
    return { success: false, status: 401, error: "Unauthorized" };
  }
  return { success: true, user };
}

// GET: Fetch user organization mappings
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await verifyAccess();
  if (!access.success) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const list = await db
      .select({
        id: userOrganizations.id,
        organizationId: userOrganizations.organizationId,
        orgName: organizations.name,
        orgCode: organizations.code,
        orgType: organizations.type,
        positionId: userOrganizations.positionRefItemId,
        positionName: refItems.name,
        isPrimary: userOrganizations.isPrimary,
        createdAt: userOrganizations.createdAt,
      })
      .from(userOrganizations)
      .innerJoin(organizations, eq(userOrganizations.organizationId, organizations.id))
      .leftJoin(refItems, eq(userOrganizations.positionRefItemId, refItems.id))
      .where(eq(userOrganizations.userId, id));

    return NextResponse.json({ success: true, list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Map user to organization and position
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await verifyAccess();
  if (!access.success) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const { organizationId, positionId, isPrimary } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    }

    // If setting as primary, unset other primary mappings first
    if (isPrimary) {
      await db
        .update(userOrganizations)
        .set({ isPrimary: false })
        .where(eq(userOrganizations.userId, id));
    }

    // Insert or update mapping
    const [existing] = await db
      .select()
      .from(userOrganizations)
      .where(
        and(
          eq(userOrganizations.userId, id),
          eq(userOrganizations.organizationId, organizationId)
        )
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(userOrganizations)
        .set({
          positionRefItemId: positionId || null,
          isPrimary: !!isPrimary,
        })
        .where(eq(userOrganizations.id, existing.id))
        .returning();
      return NextResponse.json({ success: true, mapping: updated });
    }

    const [newMapping] = await db
      .insert(userOrganizations)
      .values({
        userId: id,
        organizationId,
        positionRefItemId: positionId || null,
        isPrimary: !!isPrimary,
      })
      .returning();

    return NextResponse.json({ success: true, mapping: newMapping });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove organization mapping for user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await verifyAccess();
  if (!access.success) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const mappingId = searchParams.get("mappingId");

    if (!mappingId) {
      return NextResponse.json({ error: "mappingId query parameter is required" }, { status: 400 });
    }

    await db
      .delete(userOrganizations)
      .where(
        and(
          eq(userOrganizations.id, mappingId),
          eq(userOrganizations.userId, id)
        )
      );

    return NextResponse.json({ success: true, message: "Organization mapping deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
