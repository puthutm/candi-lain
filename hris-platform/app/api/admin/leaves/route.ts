import { NextResponse } from "next/server";
import { db } from "@/db";
import { leaveRequests, leaveTypes } from "@/db/schema/leave";
import { employees } from "@/db/schema/civitas";
import { eq, desc } from "drizzle-orm";
import { cookies } from "next/headers";

// GET: List all leave requests
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("hris_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const list = await db
      .select({
        id: leaveRequests.id,
        employeeName: employees.fullName,
        employeeNumber: employees.employeeNumber,
        leaveTypeName: leaveTypes.name,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        requestedAt: leaveRequests.requestedAt,
      })
      .from(leaveRequests)
      .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
      .leftJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
      .orderBy(desc(leaveRequests.requestedAt));

    return NextResponse.json({ success: true, leaveRequests: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Approve or reject a leave request
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("hris_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing ID or status" }, { status: 400 });
    }

    if (status !== "disetujui" && status !== "ditolak") {
      return NextResponse.json({ success: false, error: "Status tidak valid" }, { status: 400 });
    }

    await db
      .update(leaveRequests)
      .set({
        status,
        approvedBy: sessionUser.userId,
        approvedAt: new Date()
      })
      .where(eq(leaveRequests.id, id));

    return NextResponse.json({ success: true, message: `Permohonan cuti berhasil di-${status}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
