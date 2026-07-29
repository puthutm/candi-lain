import { NextResponse } from "next/server";
import { db } from "@/db";
import { lmsGrades } from "@/db/schema/grades";
import { eq } from "drizzle-orm";
import { ssoUsers } from "@/db/schema/sso";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json({ success: false, error: "Missing classId" }, { status: 400 });
    }

    // 1. Fetch grades from lmsGrades table
    const gradesList = await db
      .select({
        id: lmsGrades.id,
        classId: lmsGrades.classId,
        studentUserId: lmsGrades.studentUserId,
        studentName: ssoUsers.fullName,
        attendanceScore: lmsGrades.attendanceScore,
        assignmentScore: lmsGrades.assignmentScore,
        utsScore: lmsGrades.utsScore,
        uasScore: lmsGrades.uasScore,
        finalScore: lmsGrades.finalScore,
        letterGrade: lmsGrades.letterGrade,
        publishedToSiakad: lmsGrades.publishedToSiakad,
      })
      .from(lmsGrades)
      .leftJoin(ssoUsers, eq(lmsGrades.studentUserId, ssoUsers.id))
      .where(eq(lmsGrades.classId, classId));

    return NextResponse.json({ success: true, grades: gradesList });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
