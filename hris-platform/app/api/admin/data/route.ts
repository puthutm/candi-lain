import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizationUnits, positions, employees, leaveTypes } from "@/db/schema";

import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("hris_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
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
