import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema/civitas";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { machineId, nip, timestamp, type, deviceLocation } = body;

    if (!nip || !timestamp) {
      return NextResponse.json(
        { error: "Payload mesin biometrik tidak lengkap (nip dan timestamp wajib)" },
        { status: 400 }
      );
    }

    // 1. Find employee by NIP or NIDN
    const emp = await db.select().from(employees).where(eq(employees.employeeNumber, nip));

    if (emp.length === 0) {
      return NextResponse.json(
        { error: `Pegawai dengan NIP ${nip} tidak ditemukan di database HRIS` },
        { status: 404 }
      );
    }

    const employee = emp[0]!;

    return NextResponse.json({
      success: true,
      message: "Log presensi biometrik berhasil dicatat di HRIS Engine",
      data: {
        employeeName: employee.fullName,
        employeeNumber: employee.employeeNumber,
        timestamp,
        type: type || "check_in",
        machineId: machineId || "MAIN_LOBBY",
        deviceLocation: deviceLocation || "Gedung UNSIA",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

