import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lmsGrades, lmsClasses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { publishFinalGradesToSiakad } from "@/lib/siakad-publisher";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { classId, studentUserId, attendanceScore, assignmentScore, utsScore, uasScore } = body;

    if (!classId || !studentUserId) {
      return NextResponse.json(
        { success: false, error: "classId dan studentUserId wajib diisi" },
        { status: 400 }
      );
    }

    // 1. Calculate final score (Attendance 10%, Assignment 20%, UTS 35%, UAS 35%)
    const att = parseFloat(attendanceScore || "100");
    const ass = parseFloat(assignmentScore || "0");
    const uts = parseFloat(utsScore || "0");
    const uas = parseFloat(uasScore || "0");

    const finalScore = Math.round((att * 0.1 + ass * 0.2 + uts * 0.35 + uas * 0.35) * 100) / 100;

    let letterGrade = "F";
    if (finalScore >= 85) letterGrade = "A";
    else if (finalScore >= 80) letterGrade = "A-";
    else if (finalScore >= 75) letterGrade = "B+";
    else if (finalScore >= 70) letterGrade = "B";
    else if (finalScore >= 65) letterGrade = "B-";
    else if (finalScore >= 60) letterGrade = "C+";
    else if (finalScore >= 55) letterGrade = "C";
    else if (finalScore >= 45) letterGrade = "D";
    else letterGrade = "E";

    // 2. Upsert grade in LMS database
    const existingGrades = await db
      .select()
      .from(lmsGrades)
      .where(and(eq(lmsGrades.classId, classId), eq(lmsGrades.studentUserId, studentUserId)));

    let gradeRecord;
    if (existingGrades.length > 0) {
      const [updated] = await db
        .update(lmsGrades)
        .set({
          attendanceScore: String(att),
          assignmentScore: String(ass),
          utsScore: String(uts),
          uasScore: String(uas),
          finalScore: String(finalScore),
          letterGrade,
          publishedToSiakad: true,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(lmsGrades.id, existingGrades[0]!.id))
        .returning();

      gradeRecord = updated;
    } else {
      const [created] = await db
        .insert(lmsGrades)
        .values({
          classId,
          studentUserId,
          attendanceScore: String(att),
          assignmentScore: String(ass),
          utsScore: String(uts),
          uasScore: String(uas),
          finalScore: String(finalScore),
          letterGrade,
          publishedToSiakad: true,
          publishedAt: new Date(),
        })
        .returning();

      gradeRecord = created;
    }

    // 3. Fetch LMS Class info for SIAKAD reference
    const [targetClass] = await db.select().from(lmsClasses).where(eq(lmsClasses.id, classId));

    // 4. Publish to SIAKAD Webhook
    const publishResult = await publishFinalGradesToSiakad({
      siakadClassId: targetClass?.siakadClassId || classId,
      studentUserId,
      finalScore,
      letterGrade,
      tugasScore: ass,
      utsScore: uts,
      uasScore: uas,
    });

    return NextResponse.json({
      success: true,
      message: `Nilai akhir ${letterGrade} (${finalScore}) berhasil dikunci dan dikirim ke SIAKAD!`,
      grade: gradeRecord,
      siakadPublishStatus: publishResult,
    });
  } catch (error: any) {
    console.error("[Grade Finalize Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mempublikasikan nilai" },
      { status: 500 }
    );
  }
}
