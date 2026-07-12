import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadKrsHeader } from "@/db/schema/krs";
import { siakadStudents } from "@/db/schema/civitas";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db
      .select({
        id: siakadKrsHeader.id,
        approvalStatus: siakadKrsHeader.approvalStatus,
        createdAt: siakadKrsHeader.createdAt,
        studentName: siakadStudents.fullName,
        nim: siakadStudents.nim,
      })
      .from(siakadKrsHeader)
      .leftJoin(siakadStudents, eq(siakadKrsHeader.studentId, siakadStudents.id));

    return NextResponse.json({ success: true, submissions: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { headerId, approvalStatus, notes } = body;

    if (!headerId || !approvalStatus) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    await db
      .update(siakadKrsHeader)
      .set({
        approvalStatus,
        approverNotes: notes || "",
        approvedAt: new Date(),
      })
      .where(eq(siakadKrsHeader.id, headerId));

    return NextResponse.json({
      success: true,
      message: `KRS status updated to ${approvalStatus}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
