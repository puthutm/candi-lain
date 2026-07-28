import { NextResponse } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { postgresClient } from "@/db";

export async function POST() {
  try {
    // Step 1: Sync HRIS Employees -> SSO Users
    const hrisEmployees = await db.select().from(employees);
    let hrisToSsoCount = 0;

    for (const emp of hrisEmployees) {
      const email = `${emp.employeeNumber.toLowerCase().replace(/[^a-z0-9]/g, "")}@unsia.ac.id`;
      const username = emp.employeeNumber;

      const existingUser = await postgresClient`
        SELECT id FROM users WHERE username = ${username} OR email = ${email} LIMIT 1
      `;

      let userId = existingUser[0]?.id;

      if (!userId) {
        const [newUser] = await postgresClient`
          INSERT INTO users (username, email, password_hash, full_name, status)
          VALUES (${username}, ${email}, '$2a$10$abcdefghijklmnopqrstuv', ${emp.fullName}, 'active')
          RETURNING id
        `;
        userId = newUser?.id;
      }

      if (userId) {
        const roleKey = emp.employeeType === "dosen" ? "dosen" : "pegawai";
        await postgresClient`
          INSERT INTO user_roles (id, user_id, role_key)
          VALUES (gen_random_uuid(), ${userId}, ${roleKey})
          ON CONFLICT DO NOTHING
        `;
        hrisToSsoCount++;
      }
    }

    // Step 2: Sync SSO Users -> HRIS Employees (Import missing SSO staff/lecturers into HRIS)
    const ssoUsers = await postgresClient`
      SELECT u.id, u.username, u.email, u.full_name, r.role_key
      FROM users u
      LEFT JOIN user_roles r ON u.id = r.user_id
    `;

    let ssoToHrisCount = 0;

    for (const ssoUser of ssoUsers) {
      // Ignore student accounts (usernames starting with digits or role 'mahasiswa')
      const isStudent = ssoUser.role_key === "mahasiswa" || /^\d+$/.test(ssoUser.username);
      if (isStudent) continue;

      // Check if employee already exists in HRIS by employeeNumber or fullName
      const existingEmp = hrisEmployees.find(
        (e) => e.employeeNumber === ssoUser.username || e.fullName === ssoUser.full_name
      );

      if (!existingEmp) {
        const empType = ssoUser.role_key === "dosen" ? "dosen" : "tendik";
        const empNum = ssoUser.username.includes("-")
          ? ssoUser.username
          : `${empType === "dosen" ? "DOS" : "PEG"}-2026-${ssoUser.username.toUpperCase()}`;

        await db.insert(employees).values({
          employeeNumber: empNum,
          fullName: ssoUser.full_name || ssoUser.username,
          employeeType: empType,
          organizationUnitId: "00000000-0000-0000-0000-000000000001",
          positionId: "00000000-0000-0000-0000-000000000001",
          rankGroup: empType === "dosen" ? "III/c" : "III/a",
          baseSalary: empType === "dosen" ? 6500000 : 5500000,
          status: "aktif",
          employmentStatus: "tetap",
          nidn: empType === "dosen" ? "04" + Math.floor(10000000 + Math.random() * 90000000) : null,
          bankAccountNumber: "876543210987",
          bankName: "BCA",
        });

        ssoToHrisCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi dua arah sukses: ${hrisToSsoCount} akun HRIS->SSO, ${ssoToHrisCount} pegawai SSO->HRIS baru didaftarkan!`,
      hrisToSsoCount,
      ssoToHrisCount,
    });
  } catch (error: any) {
    console.error("[SSO-HRIS Bidirectional Sync Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}

export const dynamic = "force-dynamic";
