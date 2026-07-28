import { NextResponse } from "next/server";
import { db } from "@/db";
import { leaveRequests, leaveTypes } from "@/db/schema/leave";
import { employees } from "@/db/schema/civitas";
import { eq, desc } from "drizzle-orm";
import { cookies } from "next/headers";

// GET: Get employee leave requests and balance
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("hris_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);
    const { searchParams } = new URL(req.url);
    const employeeIdParam = searchParams.get("employeeId");

    // Find target employee by ssoUserId or employeeId
    let employeeId = employeeIdParam;
    if (!employeeId) {
      const [emp] = await db
        .select()
        .from(employees)
        .where(eq(employees.ssoUserId, sessionUser.userId))
        .limit(1);

      if (emp) {
        employeeId = emp!.id;
      } else {
        // Fallback: pick first active employee for dev mode preview
        const [firstEmp] = await db.select().from(employees).limit(1);
        employeeId = firstEmp?.id ?? null;
      }
    }

    if (!employeeId) {
      return NextResponse.json({ success: false, error: "Data pegawai tidak ditemukan" }, { status: 404 });
    }

    const requests = await db
      .select({
        id: leaveRequests.id,
        leaveTypeName: leaveTypes.name,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        requestedAt: leaveRequests.requestedAt,
      })
      .from(leaveRequests)
      .leftJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
      .where(eq(leaveRequests.employeeId, employeeId))
      .orderBy(desc(leaveRequests.requestedAt));

    const allTypes = await db.select().from(leaveTypes);

    return NextResponse.json({
      success: true,
      employeeId,
      requests,
      leaveTypes: allTypes,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new leave request
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, leaveTypeId, startDate, endDate, reason } = body;

    if (!employeeId || !leaveTypeId || !startDate || !endDate || !reason) {
      return NextResponse.json({ success: false, error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    const [newRequest] = await db
      .insert(leaveRequests)
      .values({
        employeeId,
        leaveTypeId,
        startDate,
        endDate,
        reason,
        status: "menunggu",
      })
      .returning();

    return NextResponse.json({ success: true, message: "Pengajuan cuti berhasil dikirim!", data: newRequest });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
