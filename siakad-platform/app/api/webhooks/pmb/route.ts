import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadStudents } from "@/db/schema/civitas";
import { siakadStudyPrograms } from "@/db/schema/master";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { event, data } = payload;

    if (event !== "applicant.accepted_and_paid" || !data) {
      return NextResponse.json({ success: false, error: "Invalid event type" }, { status: 400 });
    }

    const { pmb_applicant_id, full_name, email, phone } = data;

    // 1. Idempotency check: verify if pmb_applicant_id is already registered
    const existing = await db
      .select()
      .from(siakadStudents)
      .where(eq(siakadStudents.applicantId, pmb_applicant_id))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Applicant already registered as student (idempotent)",
        student: existing[0],
      });
    }

    // 2. Fetch a valid study program to refer
    let progs = await db.select().from(siakadStudyPrograms).limit(1);
    if (progs.length === 0) {
      // Create a mock study program if none exists to prevent FK failures
      const [newProg] = await db
        .insert(siakadStudyPrograms)
        .values({
          name: "Informatika",
          faculty: "Sains dan Teknologi",
          degreeLevel: "S1",
        })
        .returning();
      progs = [newProg!];
    }

    const targetProg = progs[0]!;

    // 3. Generate new NIM
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const generatedNim = `2609${randomSuffix}`;

    // 4. Insert student
    const [newStudent] = await db
      .insert(siakadStudents)
      .values({
        applicantId: pmb_applicant_id,
        nim: generatedNim,
        fullName: full_name,
        birthPlace: "Jakarta",
        birthDate: "2005-01-01",
        gender: "L",
        religion: "Islam",
        address: "Jl. Margonda Raya No. 100",
        studyProgramId: targetProg.id,
        angkatan: 2026,
        personalEmail: email,
        phone: phone || "08123456789",
        academicStatus: "aktif",
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Student profile registered from PMB webhook!",
      student: newStudent,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
