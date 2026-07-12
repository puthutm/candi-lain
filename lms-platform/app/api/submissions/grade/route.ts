import { NextResponse } from "next/server";
import { db } from "@/db";
import { assignmentSubmissions, submissionAnnotations } from "@/db/schema/sessions";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");
    const studentUserId = searchParams.get("studentUserId");

    if (!assignmentId || !studentUserId) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    const subList = await db
      .select()
      .from(assignmentSubmissions)
      .where(
        and(
          eq(assignmentSubmissions.assignmentId, assignmentId),
          eq(assignmentSubmissions.studentUserId, studentUserId)
        )
      )
      .limit(1);

    if (subList.length === 0) {
      return NextResponse.json({ success: false, error: "Submission tidak ditemukan" }, { status: 404 });
    }

    const submission = subList[0]!;

    // Fetch annotations
    const annotationsList = await db
      .select()
      .from(submissionAnnotations)
      .where(eq(submissionAnnotations.submissionId, submission.id));

    return NextResponse.json({
      success: true,
      submission,
      annotations: annotationsList,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { submissionId, score, feedback, annotations, graderUserId } = body;

    if (!submissionId || score === undefined) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    const result = await db.transaction(async (tx: any) => {
      // 1. Update assignment submission
      const [updatedSub] = await tx
        .update(assignmentSubmissions)
        .set({
          score: String(score),
          feedback: feedback || null,
          status: "dinilai",
          gradedByUserId: graderUserId,
          gradedAt: new Date(),
        })
        .where(eq(assignmentSubmissions.id, submissionId))
        .returning();

      if (!updatedSub) {
        throw new Error("Gagal mengupdate nilai tugas.");
      }

      // 2. Clear old annotations
      await tx
        .delete(submissionAnnotations)
        .where(eq(submissionAnnotations.submissionId, submissionId));

      // 3. Insert new annotations if any
      if (Array.isArray(annotations) && annotations.length > 0) {
        const insertValues = annotations.map((anno: any) => ({
          submissionId,
          pageNumber: anno.pageNumber || 1,
          position: anno.position || { x: anno.x, y: anno.y },
          note: anno.note || "",
          createdByUserId: graderUserId,
        }));

        await tx.insert(submissionAnnotations).values(insertValues);
      }

      return updatedSub;
    });

    return NextResponse.json({
      success: true,
      message: "Penilaian dan catatan anotasi berhasil disimpan!",
      submission: result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
