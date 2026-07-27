import { NextResponse } from "next/server";
import { db } from "@/db";
import { scholarshipPrograms, scholarshipRecipients } from "@/db/schema/scholarship";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [program] = await db.select().from(scholarshipPrograms).where(eq(scholarshipPrograms.id, id));
    if (!program) {
      return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });
    }

    const recipients = await db.select().from(scholarshipRecipients).where(eq(scholarshipRecipients.programId, id));

    return NextResponse.json({ success: true, program, recipients });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const [updated] = await db
      .update(scholarshipPrograms)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(scholarshipPrograms.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, program: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [deleted] = await db.delete(scholarshipPrograms).where(eq(scholarshipPrograms.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, program: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
