import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadStudyPrograms } from "@/db/schema/master";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db.select().from(siakadStudyPrograms);
    return NextResponse.json({ success: true, studyPrograms: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, code, faculty, degreeLevel } = body;

    if (!name || !faculty) {
      return NextResponse.json(
        { success: false, error: "Nama Program Studi dan Fakultas wajib diisi" },
        { status: 400 }
      );
    }

    const [inserted] = await db
      .insert(siakadStudyPrograms)
      .values({
        name,
        code: code || name.substring(0, 4).toUpperCase(),
        faculty,
        degreeLevel: degreeLevel || "S1",
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Program Studi berhasil ditambahkan!",
      studyProgram: inserted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, code, faculty, degreeLevel } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID wajib diisi" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (faculty !== undefined) updateData.faculty = faculty;
    if (degreeLevel !== undefined) updateData.degreeLevel = degreeLevel;

    const [updated] = await db
      .update(siakadStudyPrograms)
      .set(updateData)
      .where(eq(siakadStudyPrograms.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Program Studi berhasil diperbarui!",
      studyProgram: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID wajib diisi" }, { status: 400 });
    }

    await db.delete(siakadStudyPrograms).where(eq(siakadStudyPrograms.id, id));

    return NextResponse.json({
      success: true,
      message: "Program Studi berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
