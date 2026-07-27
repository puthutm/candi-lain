import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizationUnits, positions, leaveTypes, payrollComponents, taxBrackets, employees } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // 1. Seed Organization Units
    const defaultUnits = [
      { code: "FTI", name: "Fakultas Teknologi Informasi", type: "fakultas" as const },
      { code: "IF", name: "Prodi Informatika", type: "prodi" as const },
      { code: "SDM", name: "Biro Kepegawaian & SDM", type: "biro" as const },
      { code: "SI", name: "Prodi Sistem Informasi", type: "prodi" as const },
    ];

    for (const unit of defaultUnits) {
      const [existing] = await db
        .select()
        .from(organizationUnits)
        .where(eq(organizationUnits.code, unit.code))
        .limit(1);

      if (!existing) {
        await db.insert(organizationUnits).values(unit);
      }
    }

    // 2. Seed Positions
    const defaultPositions = [
      { name: "Dosen Informatika", abbreviation: "DOS-IF", functionalAllowance: 1500000, rankGroup: "III/b", isActive: true },
      { name: "Kepala Biro SDM", abbreviation: "KABIR-SDM", functionalAllowance: 2500000, rankGroup: "IV/a", isActive: true },
      { name: "Staf Administrasi SDM", abbreviation: "STAF-ADM", functionalAllowance: 500000, rankGroup: "II/a", isActive: true },
      { name: "Dosen Sistem Informasi", abbreviation: "DOS-SI", functionalAllowance: 1500000, rankGroup: "III/c", isActive: true },
    ];

    for (const pos of defaultPositions) {
      const [existing] = await db
        .select()
        .from(positions)
        .where(eq(positions.abbreviation, pos.abbreviation))
        .limit(1);

      if (!existing) {
        await db.insert(positions).values(pos);
      }
    }

    // 3. Seed Leave Types
    const defaultLeaves = [
      { code: "tahunan", name: "Cuti Tahunan", defaultQuotaDays: 12 },
      { code: "sakit", name: "Cuti Sakit", defaultQuotaDays: 30 },
      { code: "cuti_besar", name: "Cuti Besar", defaultQuotaDays: 90 },
      { code: "melahirkan", name: "Cuti Melahirkan", defaultQuotaDays: 90 },
    ];

    for (const leave of defaultLeaves) {
      const [existing] = await db
        .select()
        .from(leaveTypes)
        .where(eq(leaveTypes.code, leave.code))
        .limit(1);

      if (!existing) {
        await db.insert(leaveTypes).values(leave);
      }
    }

    // 4. Seed Payroll Components
    const defaultComponents = [
      { name: "Gaji Pokok", category: "pendapatan" as const, calculationType: "tetap" as const, isTaxable: true, isActive: true },
      { name: "Tunjangan Jabatan", category: "tunjangan" as const, calculationType: "tetap" as const, isTaxable: true, isActive: true },
      { name: "Tunjangan Transport", category: "tunjangan" as const, calculationType: "tetap" as const, isTaxable: true, isActive: true },
      { name: "BPJS Kesehatan", category: "potongan" as const, calculationType: "variabel" as const, isTaxable: false, isActive: true },
      { name: "BPJS Ketenagakerjaan", category: "potongan" as const, calculationType: "variabel" as const, isTaxable: false, isActive: true },
      { name: "PPh21 Pajak TER", category: "potongan" as const, calculationType: "variabel" as const, isTaxable: false, isActive: true },
    ];

    for (const comp of defaultComponents) {
      const [existing] = await db
        .select()
        .from(payrollComponents)
        .where(eq(payrollComponents.name, comp.name))
        .limit(1);

      if (!existing) {
        await db.insert(payrollComponents).values(comp);
      }
    }

    // 5. Seed Tax Brackets (PPh21 TER PP 58/2023)
    const defaultTaxBrackets = [
      { category: "TER_A" as const, minGross: 0, maxGross: 5400000, ratePercent: 0, effectiveFrom: "2024-01-01" },
      { category: "TER_A" as const, minGross: 5400001, maxGross: 5650000, ratePercent: 0.25, effectiveFrom: "2024-01-01" },
      { category: "TER_A" as const, minGross: 5650001, maxGross: 5950000, ratePercent: 0.5, effectiveFrom: "2024-01-01" },
      { category: "TER_A" as const, minGross: 5950001, maxGross: 6300000, ratePercent: 0.75, effectiveFrom: "2024-01-01" },
      { category: "TER_B" as const, minGross: 0, maxGross: 6200000, ratePercent: 0, effectiveFrom: "2024-01-01" },
      { category: "TER_C" as const, minGross: 0, maxGross: 6600000, ratePercent: 0, effectiveFrom: "2024-01-01" },
    ];

    for (const tb of defaultTaxBrackets) {
      const [existing] = await db
        .select()
        .from(taxBrackets)
        .where(eq(taxBrackets.minGross, tb.minGross))
        .limit(1);

      if (!existing) {
        await db.insert(taxBrackets).values(tb);
      }
    }

    // 6. Seed Sample Employees if empty
    const empCount = await db.select().from(employees);
    if (empCount.length === 0) {
      const [unitSDM] = await db.select().from(organizationUnits).where(eq(organizationUnits.code, "SDM")).limit(1);
      const [unitIF] = await db.select().from(organizationUnits).where(eq(organizationUnits.code, "IF")).limit(1);
      const [posKabir] = await db.select().from(positions).where(eq(positions.abbreviation, "KABIR-SDM")).limit(1);
      const [posDos] = await db.select().from(positions).where(eq(positions.abbreviation, "DOS-IF")).limit(1);

      if (unitSDM && posKabir && unitIF && posDos) {
        await db.insert(employees).values([
          {
            employeeNumber: "SDM-2026-001",
            fullName: "Budi Santoso, M.Kom",
            employeeType: "tendik",
            employmentStatus: "tetap",
            organizationUnitId: unitSDM.id,
            positionId: posKabir.id,
            rankGroup: "IV/a",
            baseSalary: 7500000,
            status: "aktif",
            ptkpStatus: "K/1",
            npwp: "12.345.678.9-012.000",
            bankName: "Mandiri",
            bankAccountNumber: "1234567890123",
          },
          {
            employeeNumber: "DOS-2026-002",
            fullName: "Dr. Siti Aminah, M.T",
            employeeType: "dosen",
            employmentStatus: "tetap",
            nidn: "0412345678",
            organizationUnitId: unitIF.id,
            positionId: posDos.id,
            rankGroup: "III/c",
            baseSalary: 6500000,
            status: "aktif",
            ptkpStatus: "TK/0",
            npwp: "98.765.432.1-098.000",
            bankName: "BCA",
            bankAccountNumber: "876543210987",
          },
        ]);
      }
    }

    return NextResponse.json({ success: true, message: "Master data HRIS & sampel pegawai berhasil di-seed!" });
  } catch (error: any) {
    console.error("HRIS seeding error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
