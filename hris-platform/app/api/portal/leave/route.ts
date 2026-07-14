import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { employees, leaveRequests, leaveTypes } from "@/db/schema/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("hris_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);
    if (!sessionUser || !sessionUser.userId) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
    }

    // Find employee
    const empList = await db
      .select()
      .from(employees)
      .where(eq(employees.ssoUserId, sessionUser.userId))
      .limit(1);

    const employee = empList[0];
    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { leaveTypeCode, startDate, endDate, reason } = body;

    if (!leaveTypeCode || !startDate || !endDate || !reason) {
      return NextResponse.json({ success: false, error: "Semua field (leaveTypeCode, startDate, endDate, reason) harus diisi" }, { status: 400 });
    }

    // Lookup leave type ID
    const [lType] = await db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.code, leaveTypeCode))
      .limit(1);

    if (!lType) {
      return NextResponse.json({ success: false, error: `Tipe cuti '${leaveTypeCode}' tidak ditemukan` }, { status: 400 });
    }

    // Insert leave request
    await db.insert(leaveRequests).values({
      employeeId: employee.id,
      leaveTypeId: lType.id,
      startDate,
      endDate,
      reason,
      status: "menunggu",
      requestedAt: new Date(),
    });

    return NextResponse.json({ success: true, message: "Pengajuan cuti berhasil dikirim dan sedang menunggu persetujuan." });

  } catch (error: any) {
    console.error("Leave request API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
