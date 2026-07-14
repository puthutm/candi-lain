import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { employees, attendances } from "@/db/schema/schema";
import { eq, and } from "drizzle-orm";
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

    const now = new Date();
    // Offset for local Indonesian time (WIB, UTC+7) if needed, or just use system time
    // Let's use local timezone string formatting
    const localDateStr = now.toLocaleDateString("en-CA"); // YYYY-MM-DD format
    const localTimeStr = now.toTimeString().split(" ")[0]!; // HH:MM:SS

    // Check if attendance record exists for today
    const [existingAttendance] = await db
      .select()
      .from(attendances)
      .where(
        and(
          eq(attendances.employeeId, employee.id),
          eq(attendances.attendanceDate, localDateStr)
        )
      )
      .limit(1);

    if (!existingAttendance) {
      // Check-in
      // If after 08:00:00, status is "terlambat", otherwise "hadir"
      const status = localTimeStr > "08:00:00" ? "terlambat" : "hadir";
      await db.insert(attendances).values({
        employeeId: employee.id,
        attendanceDate: localDateStr,
        status,
        checkIn: localTimeStr,
        workHours: "0.00",
      });
      return NextResponse.json({ success: true, type: "check_in", message: `Presensi masuk berhasil pada ${localTimeStr} (${status === "hadir" ? "Tepat Waktu" : "Terlambat"})` });
    } else if (!existingAttendance.checkOut) {
      // Check-out
      const checkInParts = existingAttendance.checkIn!.split(":");
      const checkOutParts = localTimeStr.split(":");
      
      const checkInHours = parseInt(checkInParts[0]!) + parseInt(checkInParts[1]!) / 60 + (parseInt(checkInParts[2]!) || 0) / 3600;
      const checkOutHours = parseInt(checkOutParts[0]!) + parseInt(checkOutParts[1]!) / 60 + (parseInt(checkOutParts[2]!) || 0) / 3600;
      
      const hoursDiff = Math.max(0, checkOutHours - checkInHours);

      await db
        .update(attendances)
        .set({
          checkOut: localTimeStr,
          workHours: hoursDiff.toFixed(2),
        })
        .where(eq(attendances.id, existingAttendance.id));

      return NextResponse.json({ success: true, type: "check_out", message: `Presensi keluar berhasil pada ${localTimeStr}. Total jam kerja: ${hoursDiff.toFixed(2)} jam.` });
    } else {
      return NextResponse.json({ success: false, error: "Anda sudah melakukan presensi masuk dan keluar hari ini." }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Attendance API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
