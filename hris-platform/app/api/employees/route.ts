import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    let list = await db
      .select()
      .from(employees)
      .orderBy(desc(employees.createdAt));

    if (list.length === 0) {
      await db.insert(employees).values([
        {
          employeeNumber: "DOS-2026-001",
          fullName: "Dr. Hendra Setiawan, M.Kom.",
          employeeType: "dosen",
          organizationUnitId: "00000000-0000-0000-0000-000000000001",
          positionId: "00000000-0000-0000-0000-000000000001",
          rankGroup: "III/c",
          baseSalary: 6500000,
          status: "aktif",
          employmentStatus: "tetap",
          nidn: "0412345678",
          bankAccountNumber: "876543210987",
          bankName: "BCA",
          npwp: "98.765.432.1-098.000",
          ptkpStatus: "TK/0",
        },
        {
          employeeNumber: "PEG-2026-002",
          fullName: "Budi Prasetyo, S.Kom.",
          employeeType: "tendik",
          organizationUnitId: "00000000-0000-0000-0000-000000000002",
          positionId: "00000000-0000-0000-0000-000000000002",
          rankGroup: "IV/a",
          baseSalary: 7500000,
          status: "aktif",
          employmentStatus: "tetap",
          nidn: null,
          bankAccountNumber: "1234567890123",
          bankName: "Mandiri",
          npwp: "12.345.678.9-012.000",
          ptkpStatus: "K/1",
        },
        {
          employeeNumber: "DOS-2026-003",
          fullName: "Siti Rahmawati, M.T.",
          employeeType: "dosen",
          organizationUnitId: "00000000-0000-0000-0000-000000000001",
          positionId: "00000000-0000-0000-0000-000000000001",
          rankGroup: "III/b",
          baseSalary: 6200000,
          status: "aktif",
          employmentStatus: "tetap",
          nidn: "0498765432",
          bankAccountNumber: "554433221100",
          bankName: "BNI",
          npwp: "45.678.901.2-034.000",
          ptkpStatus: "TK/0",
        },
      ]);

      list = await db
        .select()
        .from(employees)
        .orderBy(desc(employees.createdAt));
    }

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
