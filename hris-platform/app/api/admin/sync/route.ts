import { NextResponse } from "next/server";
import { db } from "@/db";
import { employees, organizationUnits, positions } from "@/db/schema/schema";
import { ssoUsers } from "@/db/schema/sso";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // 1. Get default organization unit and position
    const unitsList = await db.select().from(organizationUnits).limit(1);
    const positionsList = await db.select().from(positions).limit(1);

    if (unitsList.length === 0 || positionsList.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Unit Organisasi atau Jabatan belum di-seed. Silakan seed database HRIS terlebih dahulu." 
      }, { status: 400 });
    }

    const defaultUnitId = unitsList[0]!.id;
    const defaultPositionId = positionsList[0]!.id;

    // 2. Fetch all users from SSO database
    const usersList = await db.select().from(ssoUsers);
    
    let createdCount = 0;
    let skippedCount = 0;

    for (const ssoUser of usersList) {
      // Check if employee record already exists for this SSO user
      const [existingEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.ssoUserId, ssoUser.id))
        .limit(1);

      if (existingEmployee) {
        skippedCount++;
        continue;
      }

      // Determine employee type (dosen or tendik)
      const employeeType = ssoUser.username === "dosen" ? "dosen" : "tendik";
      const randomNip = `19${Math.floor(Math.random() * 20) + 80}0528${Math.floor(Math.random() * 900000) + 100000}`;

      await db.insert(employees).values({
        employeeNumber: randomNip,
        fullName: ssoUser.fullName,
        employeeType,
        organizationUnitId: defaultUnitId,
        positionId: defaultPositionId,
        rankGroup: "III/b",
        baseSalary: 4500000,
        status: "aktif",
        bankAccountNumber: "1234567890",
        bankName: "Mandiri",
        ssoUserId: ssoUser.id,
      });

      createdCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sinkronisasi sukses! ${createdCount} karyawan baru diimpor, ${skippedCount} dilewati.`,
      result: { createdCount, skippedCount } 
    });

  } catch (error: any) {
    console.error("HRIS Sync error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
