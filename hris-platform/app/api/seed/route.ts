import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizationUnits, positions, leaveTypes, payrollComponents } from "@/db/schema/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // 1. Seed Organization Units
    const defaultUnits = [
      { code: "FTI", name: "Fakultas Teknologi Informasi", type: "fakultas" as const },
      { code: "IF", name: "Prodi Informatika", type: "prodi" as const },
      { code: "SDM", name: "Biro Kepegawaian & SDM", type: "biro" as const },
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
      { name: "Staf Administrasi", abbreviation: "STAF-ADM", functionalAllowance: 500000, rankGroup: "II/a", isActive: true },
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
      { name: "BPJS Kesehatan", category: "potongan" as const, calculationType: "variabel" as const, isTaxable: false, isActive: true },
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

    return NextResponse.json({ success: true, message: "HRIS Master database seeded successfully!" });
  } catch (error: any) {
    console.error("HRIS seeding error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
