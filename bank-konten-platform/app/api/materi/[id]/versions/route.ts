import { NextResponse } from "next/server";
import { db } from "@/db";
import { materialBankItems, materialBankVersions, auditLogs } from "@/db/schema/content";
import { getSessionUser } from "@/lib/auth-helper";
import { eq } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [item] = await db
      .select()
      .from(materialBankItems)
      .where(eq(materialBankItems.id, id))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const body = await req.json();
    const { fileUrl, changelog } = body;

    if (!fileUrl) {
      return NextResponse.json({ error: "fileUrl is required" }, { status: 400 });
    }

    const nextVersion = item.currentVersionNumber + 1;

    // 1. Insert new version record
    const [newVer] = await db
      .insert(materialBankVersions)
      .values({
        materialItemId: item.id,
        versionNumber: nextVersion,
        fileUrl,
        changelog: changelog || `Revised to version ${nextVersion}`,
        uploadedByUserId: user.userId,
      })
      .returning();

    // 2. Update parent item with new version and reset status to review
    await db
      .update(materialBankItems)
      .set({
        currentVersionNumber: nextVersion,
        verificationStatus: "menunggu_prodi", // Reset back to verification pipeline
      })
      .where(eq(materialBankItems.id, item.id));

    // 3. Write Audit Log
    await db.insert(auditLogs).values({
      actorRef: user.userId,
      entityType: "materi",
      entityId: item.id,
      action: "revision",
      detail: { versionNumber: nextVersion, fileUrl, changelog },
    });

    return NextResponse.json({ success: true, version: newVer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
