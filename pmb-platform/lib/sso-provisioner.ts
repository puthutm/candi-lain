import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcrypt";

// SSO Schema Definitions
const ssoUsers = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  status: text("status").default("active").notNull(),
});

// SIAKAD Schema Definitions
const siakadStudents = pgTable("siakad_students", {
  id: uuid("id").primaryKey().defaultRandom(),
  nim: text("nim").unique().notNull(),
  fullName: text("full_name").notNull(),
  personalEmail: text("personal_email"),
  academicStatus: text("academic_status").default("aktif").notNull(),
  angkatan: text("angkatan").default("2026"),
});

export async function provisionStudentSsoAndSiakad(params: {
  nim: string;
  email: string;
  fullName: string;
  phone?: string;
  studyProgramName?: string;
}) {
  const { nim, email, fullName } = params;
  let ssoClient;
  let siakadClient;
  let ssoCreated = false;
  let siakadCreated = false;

  const pmbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/pmb_platform";

  try {
    // 1. Provision to SSO Database
    const ssoUrl = pmbUrl.replace("/pmb_platform", "/sso_platform");
    ssoClient = postgres(ssoUrl, { prepare: false });
    const ssoDb = drizzle(ssoClient);

    const existingUsers = await ssoDb
      .select()
      .from(ssoUsers)
      .where(or(eq(ssoUsers.username, nim), eq(ssoUsers.email, email)));

    if (existingUsers.length === 0) {
      const hashedPassword = await bcrypt.hash("Mahasiswa2026!", 10);
      await ssoDb.insert(ssoUsers).values({
        username: nim,
        email: email,
        fullName: fullName,
        passwordHash: hashedPassword,
        status: "active",
      });
      ssoCreated = true;
    }
  } catch (err: any) {
    console.warn("[SSO Provisioner Error]:", err.message);
  } finally {
    if (ssoClient) await ssoClient.end();
  }

  try {
    // 2. Provision to SIAKAD Database
    const siakadUrl = pmbUrl.replace("/pmb_platform", "/siakad_platform");
    siakadClient = postgres(siakadUrl, { prepare: false });
    const siakadDb = drizzle(siakadClient);

    const existingStudents = await siakadDb
      .select()
      .from(siakadStudents)
      .where(or(eq(siakadStudents.nim, nim), eq(siakadStudents.personalEmail, email)));

    if (existingStudents.length === 0) {
      await siakadDb.insert(siakadStudents).values({
        nim: nim,
        fullName: fullName,
        personalEmail: email,
        academicStatus: "aktif",
        angkatan: "2026",
      });
      siakadCreated = true;
    }
  } catch (err: any) {
    console.warn("[SIAKAD Student Sync Error]:", err.message);
  } finally {
    if (siakadClient) await siakadClient.end();
  }

  return { ssoCreated, siakadCreated };
}
