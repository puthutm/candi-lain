import { NextResponse } from "next/server";
import { db } from "@/db";
import { lmsMaterials, lmsSessions } from "@/db/schema/sessions";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const role = searchParams.get("role") || "mahasiswa"; // defaults to student view for security

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
    }

    let materialsList;
    if (role === "mahasiswa") {
      materialsList = await db
        .select()
        .from(lmsMaterials)
        .where(
          and(
            eq(lmsMaterials.sessionId, sessionId),
            eq(lmsMaterials.verificationStatus, "terbit")
          )
        );
    } else {
      materialsList = await db
        .select()
        .from(lmsMaterials)
        .where(eq(lmsMaterials.sessionId, sessionId));
    }

    return NextResponse.json({ success: true, materials: materialsList });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, materialType, title, fileUrl, durationSeconds } = body;

    if (!sessionId || !materialType || !title || !fileUrl) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    // Verify session exists
    const session = await db
      .select()
      .from(lmsSessions)
      .where(eq(lmsSessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ success: false, error: "Session tidak ditemukan" }, { status: 404 });
    }

    const [material] = await db
      .insert(lmsMaterials)
      .values({
        sessionId,
        materialType,
        title,
        fileUrl,
        durationSeconds: durationSeconds || null,
        verificationStatus: "menunggu_prodi",
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Bahan ajar berhasil diunggah dan diajukan ke Kaprodi!",
      material,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
