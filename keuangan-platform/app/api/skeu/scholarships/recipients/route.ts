import { NextResponse } from "next/server";
import { db } from "@/db";
import { scholarshipRecipients } from "@/db/schema/scholarship";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * Manajemen Penerima Beasiswa per Program
 * GET  — list penerima (filter by programId)
 * POST — tambah penerima baru
 */
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");

    let query = db.select().from(scholarshipRecipients);
    if (programId) {
      query = query.where(eq(scholarshipRecipients.programId, programId)) as any;
    }
    const recipients = await query;

    return NextResponse.json({ success: true, recipients });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { programId, studentUserId, studentNameSnapshot, academicPeriod, nominalAwarded } = body;

    if (!programId || !studentUserId || !academicPeriod || !nominalAwarded) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const [recipient] = await db
      .insert(scholarshipRecipients)
      .values({
        programId,
        studentUserId,
        studentNameSnapshot,
        academicPeriod,
        nominalAwarded,
        status: "aktif",
      })
      .returning();

    return NextResponse.json({ success: true, recipient }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing recipient id" }, { status: 400 });
    }

    const [deleted] = await db.delete(scholarshipRecipients).where(eq(scholarshipRecipients.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Recipient not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, recipient: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
