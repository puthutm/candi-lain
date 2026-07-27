import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db
      .select()
      .from(employees)
      .orderBy(desc(employees.createdAt));

    return NextResponse.json({
      success: true,
      employees: list,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      employeeNumber,
      fullName,
      employeeType,
      organizationUnitId,
      positionId,
      rankGroup,
      baseSalary,
      nidn,
      npwp,
      ptkpStatus,
      bankAccountNumber,
      bankName,
    } = body;

    if (!employeeNumber || !fullName || !employeeType || !baseSalary || !bankAccountNumber) {
      return NextResponse.json(
        { success: false, error: "Data wajib pegawai tidak lengkap" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(employees)
      .values({
        employeeNumber,
        fullName,
        employeeType: employeeType || "dosen",
        organizationUnitId: organizationUnitId || "00000000-0000-0000-0000-000000000001",
        positionId: positionId || "00000000-0000-0000-0000-000000000001",
        rankGroup: rankGroup || "III/a",
        baseSalary: Number(baseSalary),
        nidn: nidn || null,
        npwp: npwp || null,
        ptkpStatus: ptkpStatus || "TK/0",
        bankAccountNumber,
        bankName: bankName || "BCA",
        status: "aktif",
        employmentStatus: "tetap",
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: `Pegawai ${fullName} (${employeeNumber}) berhasil didaftarkan!`,
      employee: created,
    });
  } catch (error: any) {
    console.error("[Employee API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membuat data pegawai" },
      { status: 500 }
    );
  }
}
