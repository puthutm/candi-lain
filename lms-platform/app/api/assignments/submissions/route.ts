import { NextResponse } from "next/server";
import { db } from "@/db";
import { lmsSessions, lmsAssignments, assignmentSubmissions } from "@/db/schema/sessions";
import { classEnrollments } from "@/db/schema/classes";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
    }

    // 1. Get assignments of this session
    const assignList = await db
      .select()
      .from(lmsAssignments)
      .where(eq(lmsAssignments.sessionId, sessionId));

    if (assignList.length === 0) {
      // Auto-create a mock assignment if none exists for this session to keep it dynamic!
      const [newAssign] = await db
        .insert(lmsAssignments)
        .values({
          sessionId,
          title: `Tugas Pembahasan Sesi`,
          instructions: "Tuliskan rangkuman dan penyelesaian studi kasus untuk pertemuan ini.",
          weightPercent: "20.00",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // H+7
        })
        .returning();
      
      assignList.push(newAssign!);
    }

    const assignment = assignList[0]!;

    // 2. Fetch submissions for this assignment
    let submissionsList = await db
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.assignmentId, assignment.id));

    // 3. If no submissions exist, populate them dynamically from class enrollments!
    if (submissionsList.length === 0) {
      // Get the class ID of the session
      const sessionList = await db
        .select()
        .from(lmsSessions)
        .where(eq(lmsSessions.id, sessionId))
        .limit(1);
      const session = sessionList[0];
      
      if (session) {
        const enrolledStudents = await db
          .select()
          .from(classEnrollments)
          .where(
            and(
              eq(classEnrollments.classId, session.classId),
              eq(classEnrollments.role, "mahasiswa")
            )
          );

        if (enrolledStudents.length > 0) {
          const defaultSubmissions = enrolledStudents.map((student: any) => ({
            assignmentId: assignment.id,
            studentUserId: student.userId,
            answerText: `Ini draf pengerjaan tugas oleh mahasiswa.`,
            status: "draft" as const,
          }));

          const inserted = await db
            .insert(assignmentSubmissions)
            .values(defaultSubmissions)
            .returning();
          
          submissionsList = inserted;
        }
      }
    }

    return NextResponse.json({
      success: true,
      assignment,
      submissions: submissionsList,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assignmentId, studentUserId, answerText, status } = body;

    if (!assignmentId || !studentUserId || !answerText) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    // Upsert submission
    const existing = await db
      .select()
      .from(assignmentSubmissions)
      .where(
        and(
          eq(assignmentSubmissions.assignmentId, assignmentId),
          eq(assignmentSubmissions.studentUserId, studentUserId)
        )
      )
      .limit(1);

    let submission;
    if (existing.length > 0) {
      const [updated] = await db
        .update(assignmentSubmissions)
        .set({
          answerText,
          status: status || "terkirim",
          submittedAt: new Date(),
        })
        .where(eq(assignmentSubmissions.id, existing[0]!.id))
        .returning();
      submission = updated;
    } else {
      const [inserted] = await db
        .insert(assignmentSubmissions)
        .values({
          assignmentId,
          studentUserId,
          answerText,
          status: status || "terkirim",
          submittedAt: new Date(),
        })
        .returning();
      submission = inserted;
    }

    return NextResponse.json({
      success: true,
      message: "Tugas berhasil dikirim!",
      submission,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
