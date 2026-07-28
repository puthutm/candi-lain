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

    console.log("\n✅ Seeder Pegawai & Dosen completed successfully!");
    console.log("==========================================");
    console.log("Creds summary:");
    console.log("  1. Username : dosen");
    console.log("     Password : password123");
    console.log("     Role     : Dosen (SIAKAD, LMS), Pegawai (HRIS)");
    console.log("  2. Username : pegawai");
    console.log("     Password : password123");
    console.log("     Role     : Pegawai/Admin SDM (HRIS), Staf Keuangan/PMB");
    console.log("==========================================");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Seeder failed:", error.message);
    process.exit(1);
  }
}

seedPegawaiDosen();
