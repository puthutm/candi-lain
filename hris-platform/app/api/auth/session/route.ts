import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: true, authenticated: false, user: null });
    }

    const ssoUserId = (session.user as any).id;
    const email = session.user.email || "";
    const name = session.user.name || "";
    const username = (session.user as any).username || "";

    // Sync SSO user to HRIS employees table if not linked yet
    if (ssoUserId) {
      try {
        const { db } = await import("@/db");
        const { employees, organizationUnits, positions } = await import("@/db/schema");
        const { eq, or } = await import("drizzle-orm");

        const [existingBySsoId] = await db
          .select()
          .from(employees)
          .where(eq(employees.ssoUserId, ssoUserId))
          .limit(1);

        if (!existingBySsoId) {
          // Find unlinked employee by email, fullName, or employeeNumber
          const unlinkedList = await db.select().from(employees);
          const matchedEmployee = unlinkedList.find(
            (e) =>
              !e.ssoUserId &&
              ((e.email && email && e.email.toLowerCase() === email.toLowerCase()) ||
                (e.employeeNumber && username && e.employeeNumber === username) ||
                (e.fullName && name && e.fullName.toLowerCase() === name.toLowerCase()))
          );

          if (matchedEmployee) {
            // Link existing employee to SSO user
            await db
              .update(employees)
              .set({
                ssoUserId,
                fullName: name || matchedEmployee.fullName,
                email: email || matchedEmployee.email,
                updatedAt: new Date(),
              })
              .where(eq(employees.id, matchedEmployee.id));
          } else {
            // Create new employee record for this SSO user
            const units = await db.select().from(organizationUnits).limit(1);
            const posList = await db.select().from(positions).limit(1);

            if (units.length > 0 && posList.length > 0) {
              const role = (session.user as any).role || "";
              const isDosen = role.includes("dosen") || username.toLowerCase().includes("dosen");
              await db.insert(employees).values({
                employeeNumber: username || `PEG-${Date.now()}`,
                fullName: name || "Pegawai SSO",
                email: email || null,
                employeeType: isDosen ? "dosen" : "tendik",
                employmentStatus: "tetap",
                organizationUnitId: units[0].id,
                positionId: posList[0].id,
                rankGroup: isDosen ? "III/c" : "III/a",
                baseSalary: isDosen ? 6500000 : 5000000,
                status: "aktif",
                bankName: "Bank Mandiri",
                bankAccountNumber: "1234567890",
                ssoUserId,
              });
            }
          }
        } else if (name || email) {
          // Keep name & email updated from SSO
          await db
            .update(employees)
            .set({
              fullName: name || existingBySsoId.fullName,
              email: email || existingBySsoId.email,
              updatedAt: new Date(),
            })
            .where(eq(employees.id, existingBySsoId.id));
        }
      } catch (syncErr) {
        console.warn("Non-fatal HRIS auto-sync warning:", syncErr);
      }
    }

    // Set legacy cookie for APIs
    const cookieStore = await cookies();
    cookieStore.set(
      "hris_user",
      JSON.stringify({
        userId: ssoUserId,
        name: session.user.name,
        username: (session.user as any).username,
        role: (session.user as any).role,
      }),
      { path: "/", maxAge: 86400 }
    );

    return NextResponse.json({ success: true, authenticated: true, user: session.user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
