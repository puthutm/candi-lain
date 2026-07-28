import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadStudents } from "@/db/schema/civitas";
import { siakadStudyPrograms } from "@/db/schema/master";
import { ensureSiakadSeeded } from "@/db/seed";

export async function GET() {
  try {
    await ensureSiakadSeeded();
    const students = await db.select().from(siakadStudents);
    return NextResponse.json({
      success: true,
      data: students,
      total: students.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureSiakadSeeded();
    const body = await request.json();
    const { nim, fullName, studyProgramId, angkatan } = body;

    const prodis = await db.select().from(siakadStudyPrograms);
    const validProdiId = prodis[0]?.id || "00000000-0000-0000-0000-000000000000";

    const [newStudent] = await db
      .insert(siakadStudents)
      .values({
        nim: nim || `260${Math.floor(10000 + Math.random() * 90000)}`,
        fullName: fullName || "Mahasiswa Baru PMB",
        birthPlace: "Jakarta",
        birthDate: "2004-05-15",
        gender: "L",
        religion: "Islam",
        address: "Jl. Siber Asia No. 10, Jakarta",
        studyProgramId: studyProgramId || validProdiId,
        angkatan: angkatan || 2026,
        academicStatus: "aktif",
        personalEmail: "mahasiswa.baru@unsia.ac.id",
        phone: "081234567890",
      })
      .returning();

    return NextResponse.json({ success: true, data: newStudent });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
