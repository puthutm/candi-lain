import { NextResponse } from "next/server";
import { db } from "@/db";
import { tuitionRates } from "@/db/schema/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role === "mahasiswa") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing rate ID" }, { status: 400 });
    }

    // Check if rate exists
    const [existing] = await db.select().from(tuitionRates).where(eq(tuitionRates.id, id));
    if (!existing) {
      return NextResponse.json({ success: false, error: "Tuition rate not found" }, { status: 404 });
    }

    // Prevent deletion if rate has active invoices referencing it
    const [deleted] = await db.delete(tuitionRates)
      .where(eq(tuitionRates.id, id))
      .returning();

    return NextResponse.json({ success: true, tuitionRate: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

