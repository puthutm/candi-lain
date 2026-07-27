import { NextResponse } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema/civitas";
import { organizationUnits, positions } from "@/db/schema/organization";
import { eq, desc } from "drizzle-orm";

// GET: List all employees with unit & position
export async function GET() {
  try {
    const list = await db
      .select({
        id: employees.id,
        employeeNumber: employees.employeeNumber,
        fullName: employees.fullName,
        employeeType: employees.employeeType,
        employmentStatus: employees.employmentStatus,
        rankGroup: employees.rankGroup,
        baseSalary: employees.baseSalary,
        status: employees.status,
        nidn: employees.nidn,
        npwp: employees.npwp,
        ptkpStatus: employees.ptkpStatus,
        bpjsKesehatanNumber: employees.bpjsKesehatanNumber,
        bpjsKetenagakerjaanNumber: employees.bpjsKetenagakerjaanNumber,
        joinDate: employees.joinDate,
        bankName: employees.bankName,
        bankAccountNumber: employees.bankAccountNumber,
        unitName: organizationUnits.name,
        positionName: positions.name,
        organizationUnitId: employees.organizationUnitId,
        positionId: employees.positionId,
      })
      .from(employees)
      .leftJoin(organizationUnits, eq(employees.organizationUnitId, organizationUnits.id))
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .orderBy(desc(employees.createdAt));

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create or Update employee
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      fullName,
      employeeNumber,
      employeeType,
      employmentStatus,
      organizationUnitId,
      positionId,
      rankGroup,
      baseSalary,
      status,
      nidn,
      npwp,
      ptkpStatus,
      bpjsKesehatanNumber,
      bpjsKetenagakerjaanNumber,
      joinDate,
      bankName,
      bankAccountNumber,
    } = body;

    if (!fullName || !employeeNumber || !employeeType || !organizationUnitId || !positionId) {
      return NextResponse.json({ success: false, error: "Nama, NIP, Jenis Tipe, Unit Kerja, dan Jabatan wajib diisi" }, { status: 400 });
    }

    if (id) {
      // Update employee
      await db
        .update(employees)
        .set({
          fullName,
          employeeNumber,
          employeeType,
          employmentStatus: employmentStatus || "tetap",
          organizationUnitId,
          positionId,
          rankGroup: rankGroup || "III/a",
          baseSalary: baseSalary ? Number(baseSalary) : 4000000,
          status: status || "aktif",
          nidn: nidn || null,
          npwp: npwp || null,
          ptkpStatus: ptkpStatus || "TK/0",
          bpjsKesehatanNumber: bpjsKesehatanNumber || null,
          bpjsKetenagakerjaanNumber: bpjsKetenagakerjaanNumber || null,
          joinDate: joinDate || null,
          bankName: bankName || "Mandiri",
          bankAccountNumber: bankAccountNumber || "1234567890",
          updatedAt: new Date(),
        })
        .where(eq(employees.id, id));

      return NextResponse.json({ success: true, message: "Data pegawai berhasil diperbarui" });
    } else {
      // Create new employee
      const [newEmp] = await db
        .insert(employees)
        .values({
          fullName,
          employeeNumber,
          employeeType,
          employmentStatus: employmentStatus || "tetap",
          organizationUnitId,
          positionId,
          rankGroup: rankGroup || "III/a",
          baseSalary: baseSalary ? Number(baseSalary) : 4000000,
          status: status || "aktif",
          nidn: nidn || null,
          npwp: npwp || null,
          ptkpStatus: ptkpStatus || "TK/0",
          bpjsKesehatanNumber: bpjsKesehatanNumber || null,
          bpjsKetenagakerjaanNumber: bpjsKetenagakerjaanNumber || null,
          joinDate: joinDate || null,
          bankName: bankName || "Mandiri",
          bankAccountNumber: bankAccountNumber || "1234567890",
        })
        .returning();

      return NextResponse.json({ success: true, message: "Pegawai baru berhasil ditambahkan", data: newEmp });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
