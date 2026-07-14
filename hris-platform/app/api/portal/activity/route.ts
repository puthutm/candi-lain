import { NextResponse } from "next/server";
import { db } from "@/db";
import { employees, attendances, leaveRequests, leaveTypes } from "@/db/schema/schema";
import { eq, desc } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
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

    // Fetch last 10 attendances
    const attendanceLogs = await db
      .select()
      .from(attendances)
      .where(eq(attendances.employeeId, employee.id))
      .orderBy(desc(attendances.attendanceDate))
      .limit(10);

    // Fetch last 10 leave requests
    const leaveLogs = await db
      .select({
        id: leaveRequests.id,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        requestedAt: leaveRequests.requestedAt,
        typeName: leaveTypes.name,
        typeCode: leaveTypes.code,
      })
      .from(leaveRequests)
      .innerJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
      .where(eq(leaveRequests.employeeId, employee.id))
      .orderBy(desc(leaveRequests.requestedAt))
      .limit(10);

    return NextResponse.json({
      success: true,
      employee,
      attendances: attendanceLogs,
      leaveRequests: leaveLogs,
    });

  } catch (error: any) {
    console.error("Activity API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
