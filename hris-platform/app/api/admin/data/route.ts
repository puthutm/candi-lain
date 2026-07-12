import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizationUnits, positions, employees, leaveTypes } from "@/db/schema";

export async function GET() {
  try {
    const units = await db.select().from(organizationUnits);
    const positionsList = await db.select().from(positions);
    const employeesList = await db.select().from(employees);
    const leaves = await db.select().from(leaveTypes);
    return NextResponse.json({ success: true, units, positions: positionsList, employees: employeesList, leaveTypes: leaves });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
