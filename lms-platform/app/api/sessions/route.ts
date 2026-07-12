import { NextResponse } from "next/server";
import { db } from "@/db";
import { lmsSessions } from "@/db/schema/sessions";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json({ success: false, error: "Missing classId" }, { status: 400 });
    }

    let sessionsList = await db
      .select()
      .from(lmsSessions)
      .where(eq(lmsSessions.classId, classId));

    // Auto-seed 16 sessions if none exist for this class to help test immediately!
    if (sessionsList.length === 0) {
      const defaultSessions = Array.from({ length: 16 }, (_, i) => ({
        classId,
        sessionNumber: i + 1,
        topic: `Pertemuan ke-${i + 1} - Pembahasan Materi Kuliah`,
        description: `Materi pembelajaran untuk pertemuan ke-${i + 1} kelas akademik.`,
        method: "daring_asinkronus" as const,
        status: "belum_dimulai" as const,
      }));

      const inserted = await db.insert(lmsSessions).values(defaultSessions).returning();
      sessionsList = inserted;
    }

    return NextResponse.json({ success: true, sessions: sessionsList });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
