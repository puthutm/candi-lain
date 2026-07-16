import { NextResponse } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema/civitas";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

// POST: Add or update employee
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("hris_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      fullName,
      employeeNumber,
      employeeType,
      organizationUnitId,
      positionId,
      rankGroup,
      baseSalary,
      status,
      bankName,
      bankAccountNumber,
    } = body;

    if (!fullName || !employeeNumber || !employeeType || !organizationUnitId || !positionId) {
      return NextResponse.json({ success: false, error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    if (id) {
      // Update employee
      await db
        .update(employees)
        .set({
          fullName,
          employeeNumber,
          employeeType,
          organizationUnitId,
          positionId,
          rankGroup: rankGroup || "III/a",
          baseSalary: baseSalary ? Number(baseSalary) : 4000000,
          status: status || "aktif",
          bankName: bankName || "Mandiri",
          bankAccountNumber: bankAccountNumber || "1234567890",
          updatedAt: new Date(),
        })
        .where(eq(employees.id, id));

      return NextResponse.json({ success: true, message: "Data pegawai berhasil diperbarui" });
    } else {
      // Create employee
      const [newEmployee] = await db
        .insert(employees)
        .values({
          fullName,
          employeeNumber,
          employeeType,
          organizationUnitId,
          positionId,
          rankGroup: rankGroup || "III/a",
          baseSalary: baseSalary ? Number(baseSalary) : 4000000,
          status: status || "aktif",
          bankName: bankName || "Mandiri",
          bankAccountNumber: bankAccountNumber || "1234567890",
          ssoUserId: "00000000-0000-0000-0000-000000000000", // placeholder for direct added
        })
        .returning();

      return NextResponse.json({ success: true, message: "Karyawan baru berhasil ditambahkan", employee: newEmployee });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
