import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { employees, organizationUnits, positions } from "@/db/schema/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvText } = body;
    if (!csvText) {
      return NextResponse.json({ success: false, error: "csvText is required" }, { status: 400 });
    }

    const lines = csvText.split("\n").map((line: string) => line.trim()).filter((line: string) => line.length > 0);
    if (lines.length <= 1) {
      return NextResponse.json({ success: false, error: "CSV file is empty" }, { status: 400 });
    }

    // Get default organization unit and position
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

    // Expected format:
    // employeeNumber,fullName,employeeType,rankGroup,baseSalary,bankAccountNumber,bankName
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i]!.split(",").map((p: string) => p.trim());
      if (parts.length < 7) continue;

      const employeeNumber = parts[0]!;
      const fullName = parts[1]!;
      const employeeTypeInput = parts[2]!.toLowerCase();
      const employeeType = employeeTypeInput === "dosen" ? "dosen" : "tendik";
      const rankGroup = parts[3]!;
      const baseSalary = parseInt(parts[4] || "4000000");
      const bankAccountNumber = parts[5]!;
      const bankName = parts[6]!;

      if (!employeeNumber || !fullName) continue;

      // Update if exists, otherwise insert
      const [existing] = await db
        .select()
        .from(employees)
        .where(eq(employees.employeeNumber, employeeNumber))
        .limit(1);

      if (existing) {
        await db
          .update(employees)
          .set({
            fullName,
            employeeType,
            rankGroup,
            baseSalary,
            bankAccountNumber,
            bankName,
            updatedAt: new Date(),
          })
          .where(eq(employees.id, existing.id));
      } else {
        // Generate a random ssoUserId since they are imported without explicit sso link
        const randomSsoUserId = crypto.randomUUID();
        await db.insert(employees).values({
          employeeNumber,
          fullName,
          employeeType,
          organizationUnitId: defaultUnitId,
          positionId: defaultPositionId,
          rankGroup,
          baseSalary,
          status: "aktif",
          bankAccountNumber,
          bankName,
          ssoUserId: randomSsoUserId,
        });
      }
      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error("CSV import error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
