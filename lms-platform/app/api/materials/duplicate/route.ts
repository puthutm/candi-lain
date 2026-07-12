import { NextResponse } from "next/server";
import { db } from "@/db";
import { lmsMaterials, lmsSessions } from "@/db/schema/sessions";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sourceClassId, targetClassId } = body;

    if (!sourceClassId || !targetClassId) {
      return NextResponse.json({ success: false, error: "Missing sourceClassId or targetClassId" }, { status: 400 });
    }

    // 1. Get all sessions of target class
    const targetSessions = await db
      .select()
      .from(lmsSessions)
      .where(eq(lmsSessions.classId, targetClassId));

    if (targetSessions.length === 0) {
      return NextResponse.json({ success: false, error: "Target class has no sessions. Sync first!" }, { status: 400 });
    }

    // 2. Get all sessions of source class
    const sourceSessions = await db
      .select()
      .from(lmsSessions)
      .where(eq(lmsSessions.classId, sourceClassId));

    let duplicatedCount = 0;

    // 3. Copy materials for matching session numbers
    await db.transaction(async (tx: any) => {
      for (const srcSess of sourceSessions) {
        const matchingTargetSess = targetSessions.find((t) => t.sessionNumber === srcSess.sessionNumber);
        
        if (matchingTargetSess) {
          // Get materials of source session
          const srcMaterials = await tx
            .select()
            .from(lmsMaterials)
            .where(eq(lmsMaterials.sessionId, srcSess.id));

          if (srcMaterials.length > 0) {
            const valuesToInsert = srcMaterials.map((mat: any) => ({
              sessionId: matchingTargetSess.id,
              materialType: mat.materialType,
              title: `[Copy] ${mat.title}`,
              fileUrl: mat.fileUrl,
              verificationStatus: "menunggu_prodi" as const,
            }));

            await tx.insert(lmsMaterials).values(valuesToInsert);
            duplicatedCount += valuesToInsert.length;
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Duplikasi sukses! Menyalin ${duplicatedCount} bahan ajar sebagai draf.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
