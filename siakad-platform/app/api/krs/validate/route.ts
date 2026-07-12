import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadKrs } from "@/db/schema/krs";
import { siakadStudents } from "@/db/schema/civitas";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db
      .select({
        id: siakadKrs.id,
        approvalStatus: siakadKrs.status,
        createdAt: siakadKrs.submittedAt,
        studentName: siakadStudents.fullName,
        nim: siakadStudents.nim,
      })
      .from(siakadKrs)
      .leftJoin(siakadStudents, eq(siakadKrs.studentId, siakadStudents.id));

    return NextResponse.json({ success: true, submissions: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { headerId, approvalStatus } = body;

    if (!headerId || !approvalStatus) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    await db
      .update(siakadKrs)
      .set({
        status: approvalStatus,
        submittedAt: new Date(),
      })
      .where(eq(siakadKrs.id, headerId));

    return NextResponse.json({
      success: true,
      message: `KRS status updated to ${approvalStatus}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
