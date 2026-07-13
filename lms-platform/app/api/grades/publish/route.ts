import { NextResponse } from "next/server";
import { db } from "@/db";
import { lmsClasses, classEnrollments } from "@/db/schema/classes";
import { lmsGrades } from "@/db/schema/grades";
import { lmsSessions, lmsAssignments, assignmentSubmissions } from "@/db/schema/sessions";
import { videoConferences, vcAttendances } from "@/db/schema/vicon";
import { eq, and, count } from "drizzle-orm";
import { env } from "@/lib/env";


function getGradePoint(letter: string): string {
  switch (letter) {
    case "A": return "4.00";
    case "B": return "3.00";
    case "C": return "2.00";
    case "D": return "1.00";
    default: return "0.00";
  }
}

function getLetterGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { classId, dosenUserId } = body;

    if (!classId || !dosenUserId) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // 1. Get LMS Class
      const clsList = await tx
        .select()
        .from(lmsClasses)
        .where(eq(lmsClasses.id, classId))
        .limit(1);

      if (clsList.length === 0) {
        throw new Error("Kelas LMS tidak ditemukan");
      }
      const lmsClass = clsList[0]!;

      if (lmsClass.dosenUserId !== dosenUserId) {
        throw new Error("Anda tidak memiliki wewenang untuk kelas ini");
      }

      // 2. Fetch all student enrollments
      const students = await tx
        .select()
        .from(classEnrollments)
        .where(
          and(
            eq(classEnrollments.classId, classId),
            eq(classEnrollments.role, "mahasiswa")
          )
        );

      const publishedList = [];

      for (const student of students) {
        // A. Calculate presence score
        // Count total Jitsi sessions in the class
        const viconList = await tx
          .select({ id: videoConferences.id })
          .from(videoConferences)
          .innerJoin(lmsSessions, eq(videoConferences.sessionId, lmsSessions.id))
          .where(eq(lmsSessions.classId, classId));

        let presenceScore = 100;
        if (viconList.length > 0) {
          const presentCountResult = await tx
            .select({ count: count() })
            .from(vcAttendances)
            .where(
              and(
                eq(vcAttendances.userId, student.userId),
                eq(vcAttendances.countedAsPresent, true)
              )
            );
          
          const presentCount = presentCountResult[0]?.count || 0;
          presenceScore = (Number(presentCount) / viconList.length) * 100;
        }

        // B. Calculate assignment average
        const submissions = await tx
          .select({ score: assignmentSubmissions.score })
          .from(assignmentSubmissions)
          .innerJoin(lmsAssignments, eq(assignmentSubmissions.assignmentId, lmsAssignments.id))
          .innerJoin(lmsSessions, eq(lmsAssignments.sessionId, lmsSessions.id))
          .where(
            and(
              eq(lmsSessions.classId, classId),
              eq(assignmentSubmissions.studentUserId, student.userId)
            )
          );

        let assignmentScore = 0;
        let utsScore = 80; // default mock
        let uasScore = 85; // default mock

        if (submissions.length > 0) {
          let sum = 0;
          submissions.forEach((s) => {
            sum += Number(s.score || 0);
          });
          assignmentScore = sum / submissions.length;
        }

        // C. Calculate final score: bobot (10% kehadiran, 50% tugas, 20% uts, 20% uas)
        const finalScore = (presenceScore * 0.1) + (assignmentScore * 0.5) + (utsScore * 0.2) + (uasScore * 0.2);
        const letterGrade = getLetterGrade(finalScore);

        // D. Insert/Update lmsGrades
        const existingGrade = await tx
          .select()
          .from(lmsGrades)
          .where(
            and(
              eq(lmsGrades.classId, classId),
              eq(lmsGrades.studentUserId, student.userId)
            )
          )
          .limit(1);

        if (existingGrade.length > 0) {
          await tx
            .update(lmsGrades)
            .set({
              attendanceScore: presenceScore.toFixed(2),
              assignmentScore: assignmentScore.toFixed(2),
              utsScore: utsScore.toFixed(2),
              uasScore: uasScore.toFixed(2),
              finalScore: finalScore.toFixed(2),
              letterGrade,
              publishedToSiakad: true,
              publishedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(lmsGrades.id, existingGrade[0]!.id));
        } else {
          await tx
            .insert(lmsGrades)
            .values({
              classId,
              studentUserId: student.userId,
              attendanceScore: presenceScore.toFixed(2),
              assignmentScore: assignmentScore.toFixed(2),
              utsScore: utsScore.toFixed(2),
              uasScore: uasScore.toFixed(2),
              finalScore: finalScore.toFixed(2),
              letterGrade,
              publishedToSiakad: true,
              publishedAt: new Date(),
            });
        }

        // E. Send grade event to SIAKAD via webhook (decoupled integration)
        if (lmsClass.siakadClassId) {
          try {
            const payload = {
              event: "grade.finalized",
              event_id: crypto.randomUUID(),
              occurred_at: new Date().toISOString(),
              data: {
                siakad_class_id: lmsClass.siakadClassId,
                student_user_id: student.userId,
                final_score: Math.round(finalScore),
                letter_grade: letterGrade,
                grade_point: getGradePoint(letterGrade),
              },
            };

            fetch(env.SIAKAD_WEBHOOK_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }).catch((err) => console.error("SIAKAD grade webhook failed", err));
          } catch (webhookErr) {
            console.error("Grade webhook trigger error", webhookErr);
          }
        }

        publishedList.push({ studentUserId: student.userId, finalScore, letterGrade });
      }

      return { classId, publishedList };
    });

    return NextResponse.json({
      success: true,
      message: `Nilai akhir berhasil dihitung dan dikirim ke SIAKAD untuk ${result.publishedList.length} mahasiswa!`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
