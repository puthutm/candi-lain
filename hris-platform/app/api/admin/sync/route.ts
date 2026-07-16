import { NextResponse } from "next/server";
import { db } from "@/db";
import { employees, organizationUnits, positions } from "@/db/schema/schema";
import { ssoUsers } from "@/db/schema/sso";
import { eq } from "drizzle-orm";
import { pgTable, uuid, text, numeric } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const siakadLecturers = pgTable("siakad_lecturers", {
  id: uuid("id").primaryKey(),
  nidn: text("nidn").unique().notNull(),
  fullName: text("full_name").notNull(),
  studyProgramId: uuid("study_program_id").notNull(),
  position: text("position"),
  bkdLoad: numeric("bkd_load").default("0.00").notNull(),
  userId: uuid("user_id"),
});

export async function POST() {
  let siakadClient;
  try {
    // 1. Get default organization unit and position
    const unitsList = await db.select().from(organizationUnits);
    const positionsList = await db.select().from(positions);

    if (unitsList.length === 0 || positionsList.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Unit Organisasi atau Jabatan belum di-seed. Silakan seed database HRIS terlebih dahulu." 
      }, { status: 400 });
    }

    // Default bindings
    const defaultUnitId = unitsList.find(u => u.code === "IF")?.id || unitsList[0]!.id;
    const defaultPositionId = positionsList.find(p => p.abbreviation === "DOS-IF")?.id || positionsList[0]!.id;
    const staffPositionId = positionsList.find(p => p.abbreviation === "STAF-ADM")?.id || positionsList[0]!.id;

    // 2. Fetch lecturers from siakad_platform database
    const hrisUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/hris_platform";
    const siakadUrl = hrisUrl.replace("/hris_platform", "/siakad_platform");
    
    siakadClient = postgres(siakadUrl, { prepare: false });
    const siakadDb = drizzle(siakadClient);
    
    let activeLecturers: any[] = [];
    try {
      activeLecturers = await siakadDb.select().from(siakadLecturers);
    } catch (e) {
      console.warn("Could not read siakad_lecturers table, falling back to empty list.", e);
    }

    // 3. Fetch all users from SSO database
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

      // Check if this SSO user matches a SIAKAD lecturer
      const matchedLecturer = activeLecturers.find(l => l.userId === ssoUser.id || l.nidn === ssoUser.username);

      let employeeType: "dosen" | "tendik" = "tendik";
      let employeeNumber = ssoUser.username;
      let fullName = ssoUser.fullName;
      let positionId = staffPositionId;

      if (matchedLecturer) {
        employeeType = "dosen";
        employeeNumber = matchedLecturer.nidn;
        fullName = matchedLecturer.fullName;
        positionId = defaultPositionId;
      } else if (ssoUser.username === "dosen") {
        employeeType = "dosen";
        employeeNumber = "0428058203"; // standard lecturer NIDN fallback
        positionId = defaultPositionId;
      }

      // Generate a clean NIP for tendik if username is not a numeric NIP
      if (employeeType === "tendik" && !/^\d+$/.test(employeeNumber)) {
        employeeNumber = `19850512201012${Math.floor(1000 + Math.random() * 9000)}`;
      }

      await db.insert(employees).values({
        employeeNumber,
        fullName,
        employeeType,
        organizationUnitId: defaultUnitId,
        positionId,
        rankGroup: "III/b",
        baseSalary: employeeType === "dosen" ? 5500000 : 4500000,
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
  } finally {
    if (siakadClient) {
      await siakadClient.end();
    }
  }
}
export const dynamic = "force-dynamic";
