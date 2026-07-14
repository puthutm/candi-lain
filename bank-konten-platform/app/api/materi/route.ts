import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { materialBankItems, materialBankVersions, auditLogs } from "@/db/schema/content";
import { getSessionUser } from "@/lib/auth-helper";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get("courseCode");
    const status = searchParams.get("status") || "terbit"; // 'terbit' by default for consumers
    const contributorId = searchParams.get("contributorId");

    const conditions = [];
    if (courseCode) conditions.push(eq(materialBankItems.courseCode, courseCode));
    if (status && status !== "all") conditions.push(eq(materialBankItems.verificationStatus, status));
    if (contributorId) conditions.push(eq(materialBankItems.contributorUserId, contributorId));

    const list = await db
      .select()
      .from(materialBankItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(materialBankItems.createdAt));

    // Fetch version details for each item
    const results = [];
    for (const item of list) {
      const versions = await db
        .select()
        .from(materialBankVersions)
        .where(eq(materialBankVersions.materialItemId, item.id))
        .orderBy(desc(materialBankVersions.versionNumber));
      
      results.push({
        ...item,
        versions,
        currentVersion: versions.find(v => v.versionNumber === item.currentVersionNumber) || versions[0] || null,
      });
    }

    return NextResponse.json({ success: true, materials: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, courseCode, topic, tags, materialType, fileUrl } = body;

    if (!title || !courseCode || !topic || !materialType || !fileUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert Item
    const [newItem] = await db
      .insert(materialBankItems)
      .values({
        title,
        description,
        courseCode,
        topic,
        tags: tags || [],
        materialType,
        contributorUserId: user.userId,
        currentVersionNumber: 1,
        verificationStatus: "menunggu_prodi", // Direct submit to prodi review
      })
      .returning();

    // Insert Initial Version
    const [newVersion] = await db
      .insert(materialBankVersions)
      .values({
        materialItemId: newItem!.id,
        versionNumber: 1,
        fileUrl,
        changelog: "Initial upload",
        uploadedByUserId: user.userId,
      })
      .returning();

    // Write Audit Log
    await db.insert(auditLogs).values({
      actorRef: user.userId,
      entityType: "materi",
      entityId: newItem!.id,
      action: "create",
      detail: { title, topic, fileUrl },
    });

    return NextResponse.json({ success: true, material: newItem, version: newVersion });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
