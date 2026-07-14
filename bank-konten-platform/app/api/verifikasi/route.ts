import { NextResponse } from "next/server";
import { db } from "@/db";
import { verificationRecords, materialBankItems, questionBankItems, auditLogs } from "@/db/schema/content";
import { getSessionUser } from "@/lib/auth-helper";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role validation: verifiers only
    if (user.role !== "verifikator_prodi" && user.role !== "verifikator_bpm" && user.role !== "admin_bank_konten") {
      return NextResponse.json({ error: "Forbidden: Verifiers only" }, { status: 403 });
    }

    const body = await req.json();
    const { contentType, contentId, stage, decision, note } = body;

    if (!contentType || !contentId || !stage || !decision) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Determine target next status
    let nextStatus = "draft";
    if (stage === "prodi") {
      nextStatus = decision === "setuju" ? "menunggu_bpm" : "revisi";
    } else if (stage === "bpm") {
      nextStatus = decision === "setuju" ? "terbit" : "revisi";
    }

    // 1. Update target table status
    if (contentType === "materi") {
      await db
        .update(materialBankItems)
        .set({ verificationStatus: nextStatus })
        .where(eq(materialBankItems.id, contentId));
    } else if (contentType === "soal") {
      await db
        .update(questionBankItems)
        .set({ verificationStatus: nextStatus })
        .where(eq(questionBankItems.id, contentId));
    } else {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    // 2. Insert Verification Log
    const [verRec] = await db
      .insert(verificationRecords)
      .values({
        contentType,
        contentId,
        stage,
        decision,
        verifierUserId: user.userId,
        note: note || null,
      })
      .returning();

    // 3. Write Audit Log
    await db.insert(auditLogs).values({
      actorRef: user.userId,
      entityType: contentType,
      entityId: contentId,
      action: `verify_${stage}_${decision}`,
      detail: { note, nextStatus },
    });

    return NextResponse.json({ success: true, verification: verRec });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
