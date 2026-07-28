import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  siakadStudents,
  siakadStudyPrograms,
  siakadKrs,
  siakadAcademicPeriods,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const _eventName = req.headers.get("X-Event-Name");
    void _eventName;
    const body = await req.json();

    const {
      pmbApplicantId,
      fullName,
      email,
      phone,
      studyProgramId,
    } = body;

    if (!pmbApplicantId || !fullName || !email) {
      return NextResponse.json(
        { success: false, error: "Payload webhook PMB tidak lengkap" },
        { status: 400 }
      );
    }

    console.log(`[SIAKAD PMB Consumer] Processing webhook for applicant ${fullName} (${email})...`);

    // 1. Idempotency check
    const existingStudents = await db
      .select()
      .from(siakadStudents)
      .where(eq(siakadStudents.personalEmail, email));

    let studentRecord = existingStudents[0];

    if (!studentRecord) {
      // Find matching study program or default to first
      const prodis = await db.select().from(siakadStudyPrograms).limit(1);
      const targetProdiId = prodis[0]?.id || studyProgramId;

      const [newStudent] = await db
        .insert(siakadStudents)
        .values({
          fullName,
          personalEmail: email,
          phone: phone || "081200000000",
          birthPlace: "Jakarta",
          birthDate: "2005-01-01",
          gender: "L",
          religion: "Islam",
          address: "-",
          studyProgramId: targetProdiId,
          academicStatus: "aktif",
          angkatan: new Date().getFullYear(),
        })
        .returning();

      studentRecord = newStudent!;
      console.log(`[SIAKAD PMB Consumer] Created student record ID: ${newStudent!.id}`);
    }

    // 2. Auto-generate KRS Perdana (Paket Semester 1)
    const activePeriods = await db
      .select()
      .from(siakadAcademicPeriods)
      .where(eq(siakadAcademicPeriods.status, "berjalan"))
      .limit(1);

    const periodId = activePeriods[0]?.id;

    if (periodId && studentRecord) {
      // Check existing KRS for period
      const existingKrs = await db
        .select()
        .from(siakadKrs)
        .where(
          and(
            eq(siakadKrs.studentId, studentRecord.id),
            eq(siakadKrs.academicPeriodId, periodId)
          )
        );

      if (existingKrs.length === 0) {
        const [krsRecord] = await db
          .insert(siakadKrs)
          .values({
            studentId: studentRecord.id,
            academicPeriodId: periodId,
            status: "disetujui_pa",
            totalSks: 20,
            maxSksAllowed: 20,
            submittedAt: new Date(),
          })
          .returning();

        console.log(`[SIAKAD PMB Consumer] Generated initial KRS ID: ${krsRecord!.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Berhasil memproses event pendaftar diterima dan membuat KRS Perdana!",
      student: studentRecord,
    });
  } catch (error: any) {
    console.error("[SIAKAD PMB Consumer Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses webhook PMB" },
      { status: 500 }
    );
  }
}
