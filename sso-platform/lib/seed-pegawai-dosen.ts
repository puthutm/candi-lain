import { db } from "@/db";
import { users, userApplicationRoles, applicationRoles, applications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";

/**
 * Seed Script: Pegawai & Dosen SSO Users
 * Password SSO: "password123"
 *
 * Usage:
 *   npx tsx lib/seed-pegawai-dosen.ts
 */

async function seedPegawaiDosen() {
  console.log("🚀 Seeding SSO Users: Pegawai & Dosen (password123)...");

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash("password123", saltRounds);

    // List of Users to Seed
    const targetUsers = [
      {
        username: "admin",
        email: "admin@unsia.ac.id",
        fullName: "Super Admin",
        status: "active" as const,
      },
      {
        username: "superadmin",
        email: "superadmin@unsia.ac.id",
        fullName: "Super Administrator",
        status: "active" as const,
      },
      {
        username: "dosen",
        email: "dosen@unsia.ac.id",
        fullName: "Dr. Hendra Setiawan, M.Kom.",
        status: "active" as const,
      },
      {
        username: "pegawai",
        email: "pegawai@unsia.ac.id",
        fullName: "Budi Prasetyo, S.Kom.",
        status: "active" as const,
      },
      {
        username: "mahasiswa",
        email: "mahasiswa@unsia.ac.id",
        fullName: "Budi Santoso",
        status: "active" as const,
      },
    ];

    const seededUserMap: Record<string, any> = {};

    for (const u of targetUsers) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.username, u.username))
        .limit(1);

      if (existing.length === 0) {
        console.log(`📝 Creating user: ${u.username} (${u.fullName})...`);
        const [inserted] = await db
          .insert(users)
          .values({
            username: u.username,
            email: u.email,
            passwordHash: passwordHash,
            fullName: u.fullName,
            status: u.status,
          })
          .returning();
        seededUserMap[u.username] = inserted;
      } else {
        const userRecord = existing[0];
        if (!userRecord) continue;

        console.log(`🔄 Updating password & details for user: ${u.username}...`);
        const [updated] = await db
          .update(users)
          .set({
            passwordHash: passwordHash,
            fullName: u.fullName,
            email: u.email,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(users.id, userRecord.id))
          .returning();
        seededUserMap[u.username] = updated;
      }
    }

    // Fetch all applications
    const allApps = await db.select().from(applications);

    const helperAssignRole = async (
      userId: string,
      clientId: string,
      roleName: string
    ) => {
      const app = allApps.find((a) => a.clientId === clientId);
      if (!app) return;

      const roleList = await db
        .select()
        .from(applicationRoles)
        .where(and(eq(applicationRoles.applicationId, app.id), eq(applicationRoles.roleKey, roleName)))
        .limit(1);

      let targetRoleId = roleList[0]?.id;

      if (!targetRoleId) {
        // Create role if missing
        const [newRole] = await db
          .insert(applicationRoles)
          .values({
            applicationId: app.id,
            roleKey: roleName,
            roleName: roleName.toUpperCase(),
            description: `${roleName} role for ${clientId}`,
            isDefault: false,
          })
          .returning();
        if (!newRole) return;
        targetRoleId = newRole.id;
      }

      const existingAssignment = await db
        .select()
        .from(userApplicationRoles)
        .where(
          and(
            eq(userApplicationRoles.userId, userId),
            eq(userApplicationRoles.applicationId, app.id),
            eq(userApplicationRoles.roleId, targetRoleId)
          )
        )
        .limit(1);

      if (existingAssignment.length === 0) {
        await db.insert(userApplicationRoles).values({
          userId,
          applicationId: app.id,
          roleId: targetRoleId,
          status: "active",
        });
        console.log(`  └ Assigned role '${roleName}' on '${clientId}'`);
      }
    };

    // Assign Roles for Admin & Superadmin (Multi-Role: All Roles Across Apps)
    for (const adminKey of ["admin", "superadmin"]) {
      if (seededUserMap[adminKey]) {
        const uId = seededUserMap[adminKey].id;
        console.log(`\n🔑 Assigning multi-roles to '${adminKey}'...`);
        await helperAssignRole(uId, "siakad-platform", "admin");
        await helperAssignRole(uId, "siakad-platform", "kaprodi");
        await helperAssignRole(uId, "lms-platform", "dosen");
        await helperAssignRole(uId, "lms-platform", "mahasiswa");
        await helperAssignRole(uId, "hris-platform", "super_admin_sdm");
        await helperAssignRole(uId, "hris-platform", "admin_data_sdm");
        await helperAssignRole(uId, "keuangan-platform", "kepala_biro");
        await helperAssignRole(uId, "keuangan-platform", "staf_penerimaan");
        await helperAssignRole(uId, "pmb-platform", "admin");
        await helperAssignRole(uId, "pmb-platform", "verifikator_berkas");
        await helperAssignRole(uId, "bank-konten-platform", "admin_bank_konten");
        await helperAssignRole(uId, "bank-konten-platform", "verifikator_prodi");
        await helperAssignRole(uId, "bank-konten-platform", "verifikator_bpm");
      }
    }

    // Assign Roles for Dosen (Multi-Role: Dosen, Kaprodi, Verifikator)
    if (seededUserMap["dosen"]) {
      const dosenId = seededUserMap["dosen"].id;
      console.log("\n🔑 Assigning multi-roles to 'dosen'...");
      await helperAssignRole(dosenId, "siakad-platform", "dosen");
      await helperAssignRole(dosenId, "siakad-platform", "kaprodi");
      await helperAssignRole(dosenId, "lms-platform", "dosen");
      await helperAssignRole(dosenId, "lms-platform", "mahasiswa");
      await helperAssignRole(dosenId, "hris-platform", "pegawai");
      await helperAssignRole(dosenId, "bank-konten-platform", "dosen");
      await helperAssignRole(dosenId, "bank-konten-platform", "verifikator_prodi");
      await helperAssignRole(dosenId, "pmb-platform", "verifikator_berkas");
      await helperAssignRole(dosenId, "keuangan-platform", "staf_penerimaan");
    }

    // Assign Roles for Pegawai (Multi-Role: Pegawai, Admin Data SDM, Admin Payroll, Approver, Staf PMB & Keuangan)
    if (seededUserMap["pegawai"]) {
      const pegawaiId = seededUserMap["pegawai"].id;
      console.log("\n🔑 Assigning multi-roles to 'pegawai'...");
      await helperAssignRole(pegawaiId, "hris-platform", "pegawai");
      await helperAssignRole(pegawaiId, "hris-platform", "admin_data_sdm");
      await helperAssignRole(pegawaiId, "hris-platform", "admin_payroll");
      await helperAssignRole(pegawaiId, "hris-platform", "approver");
      await helperAssignRole(pegawaiId, "keuangan-platform", "kepala_biro");
      await helperAssignRole(pegawaiId, "keuangan-platform", "staf_penerimaan");
      await helperAssignRole(pegawaiId, "keuangan-platform", "staf_pengeluaran");
      await helperAssignRole(pegawaiId, "keuangan-platform", "staf_akuntansi");
      await helperAssignRole(pegawaiId, "pmb-platform", "admin");
      await helperAssignRole(pegawaiId, "pmb-platform", "verifikator_berkas");
      await helperAssignRole(pegawaiId, "pmb-platform", "staff_keuangan");
      await helperAssignRole(pegawaiId, "pmb-platform", "staff_marketing");
      await helperAssignRole(pegawaiId, "siakad-platform", "admin");
      await helperAssignRole(pegawaiId, "bank-konten-platform", "admin_bank_konten");
      await helperAssignRole(pegawaiId, "bank-konten-platform", "verifikator_bpm");
    }

    // Assign Roles for Mahasiswa
    if (seededUserMap["mahasiswa"]) {
      const mhsId = seededUserMap["mahasiswa"].id;
      console.log("\n🔑 Assigning roles to 'mahasiswa'...");
      await helperAssignRole(mhsId, "siakad-platform", "mahasiswa");
      await helperAssignRole(mhsId, "lms-platform", "mahasiswa");
      await helperAssignRole(mhsId, "keuangan-platform", "mahasiswa");
      await helperAssignRole(mhsId, "pmb-platform", "pendaftar");
    }

    console.log("\n✅ Seeder SELURUH Pengguna Platform (Semua SSO) berhasil diselesaikan!");
    console.log("=================================================================");
    console.log("SUMMARY AKUN SSO (Semua Password: password123):");
    console.log("  1. Username : admin       | Role: Admin (Semua Aplikasi)");
    console.log("  2. Username : superadmin  | Role: Superadmin (Semua Aplikasi)");
    console.log("  3. Username : dosen       | Role: Dosen (SIAKAD, LMS, Bank Konten), Pegawai (HRIS)");
    console.log("  4. Username : pegawai     | Role: Pegawai/Admin SDM (HRIS), Staf (Keuangan, PMB)");
    console.log("  5. Username : mahasiswa   | Role: Mahasiswa (SIAKAD, LMS, Keuangan), Pendaftar (PMB)");
    console.log("=================================================================");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Seeder failed:", error.message);
    process.exit(1);
  }
}

seedPegawaiDosen();
