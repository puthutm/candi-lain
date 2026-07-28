import { db } from "@/db";
import { users, userRoles, roles, applications } from "@/db/schema";
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
          .where(eq(users.id, existing[0].id))
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
        .from(roles)
        .where(and(eq(roles.applicationId, app.id), eq(roles.name, roleName)))
        .limit(1);

      let targetRoleId = roleList[0]?.id;

      if (!targetRoleId) {
        // Create role if missing
        const [newRole] = await db
          .insert(roles)
          .values({
            applicationId: app.id,
            name: roleName,
            displayName: roleName.toUpperCase(),
            description: `${roleName} role for ${clientId}`,
            isDefault: false,
          })
          .returning();
        targetRoleId = newRole.id;
      }

      const existingAssignment = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.applicationId, app.id),
            eq(userRoles.roleId, targetRoleId)
          )
        )
        .limit(1);

      if (existingAssignment.length === 0) {
        await db.insert(userRoles).values({
          userId,
          applicationId: app.id,
          roleId: targetRoleId,
        });
        console.log(`  └ Assigned role '${roleName}' on '${clientId}'`);
      }
    };

    // Assign Roles for Admin & Superadmin
    for (const adminKey of ["admin", "superadmin"]) {
      if (seededUserMap[adminKey]) {
        const uId = seededUserMap[adminKey].id;
        console.log(`\n🔑 Assigning admin roles to '${adminKey}'...`);
        await helperAssignRole(uId, "siakad-platform", "admin");
        await helperAssignRole(uId, "lms-platform", "admin");
        await helperAssignRole(uId, "hris-platform", "super_admin_sdm");
        await helperAssignRole(uId, "keuangan-platform", "kepala_biro");
        await helperAssignRole(uId, "pmb-platform", "admin");
        await helperAssignRole(uId, "bank-konten-platform", "verifikator_prodi");
      }
    }

    // Assign Roles for Dosen
    if (seededUserMap["dosen"]) {
      const dosenId = seededUserMap["dosen"].id;
      console.log("\n🔑 Assigning roles to 'dosen'...");
      await helperAssignRole(dosenId, "siakad-platform", "dosen");
      await helperAssignRole(dosenId, "lms-platform", "dosen");
      await helperAssignRole(dosenId, "hris-platform", "pegawai");
      await helperAssignRole(dosenId, "bank-konten-platform", "dosen");
    }

    // Assign Roles for Pegawai
    if (seededUserMap["pegawai"]) {
      const pegawaiId = seededUserMap["pegawai"].id;
      console.log("\n🔑 Assigning roles to 'pegawai'...");
      await helperAssignRole(pegawaiId, "hris-platform", "pegawai");
      await helperAssignRole(pegawaiId, "hris-platform", "admin_data_sdm");
      await helperAssignRole(pegawaiId, "keuangan-platform", "staf_penerimaan");
      await helperAssignRole(pegawaiId, "pmb-platform", "verifikator_berkas");
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
