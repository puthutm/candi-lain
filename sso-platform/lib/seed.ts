import { db } from "@/db";
import { users } from "@/db/schema/users";
import { applications, scopes } from "@/db/schema/applications";
import { applicationRoles, userApplicationRoles } from "@/db/schema/rbac";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { env } from "./env";

export async function ensureDatabaseSeeded(force?: boolean) {
  try {
    const adminEmail = env.SUPER_ADMIN_EMAIL || "admin@example.com";
    const existingUsers = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    
    if (force) {
      console.log("Force option enabled. Clearing database tables...");
      await db.delete(userApplicationRoles);
      await db.delete(applicationRoles);
      await db.delete(applications);
      await db.delete(users);
      await db.delete(scopes);
    } else if (existingUsers.length > 0) {
      // Database has already been seeded or has data
      return;
    }

    console.log("Seeding SSO Platform Database...");

    const saltRounds = env.BCRYPT_ROUNDS || 12;

    // 1. Seed Scopes
    const defaultScopes = [
      { code: "openid", description: "Sign you in and verify your identity" },
      { code: "profile", description: "Access your profile information (name, username)" },
      { code: "email", description: "Access your email address" }
    ];

    for (const sc of defaultScopes) {
      const existingScope = await db.select().from(scopes).where(eq(scopes.code, sc.code)).limit(1);
      if (existingScope.length === 0) {
        await db.insert(scopes).values(sc);
      }
    }

    // 2. Seed Users
    // admin
    const adminPasswordHash = await bcrypt.hash(env.SUPER_ADMIN_PASSWORD || "admin-password-123", saltRounds);
    const [adminUser] = await db.insert(users).values({
      username: "admin",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      fullName: "Super Admin",
      status: "active",
    }).returning();

    // mahasiswa
    const mahasiswapsd = "mahasiswa-password-123";
    const mahasiswaPasswordHash = await bcrypt.hash(mahasiswapsd, saltRounds);
    const [mahasiswaUser] = await db.insert(users).values({
      username: "mahasiswa",
      email: "mahasiswa@example.com",
      passwordHash: mahasiswaPasswordHash,
      fullName: "Budi Santoso",
      status: "active",
    }).returning();

    // dosen
    const dosenpsd = "dosen-password-123";
    const dosenPasswordHash = await bcrypt.hash(dosenpsd, saltRounds);
    const [dosenUser] = await db.insert(users).values({
      username: "dosen",
      email: "dosen@example.com",
      passwordHash: dosenPasswordHash,
      fullName: "Dr. Hendra Setiawan, M.Kom.",
      status: "active",
    }).returning();

    // 3. Seed Applications
    const defaultApps = [
      {
        clientId: env.SEED_SIAKAD_CLIENT_ID,
        clientSecret: env.SEED_SIAKAD_CLIENT_SECRET,
        name: "SIAKAD Platform",
        description: "Sistem Informasi Akademik",
        redirectUris: [env.SEED_SIAKAD_CALLBACK_URL],
      },
      {
        clientId: env.SEED_LMS_CLIENT_ID,
        clientSecret: env.SEED_LMS_CLIENT_SECRET,
        name: "LMS Platform",
        description: "Learning Management System",
        redirectUris: [env.SEED_LMS_CALLBACK_URL],
      },
      {
        clientId: env.SEED_PMB_CLIENT_ID,
        clientSecret: env.SEED_PMB_CLIENT_SECRET,
        name: "PMB Platform",
        description: "Penerimaan Mahasiswa Baru",
        redirectUris: [env.SEED_PMB_CALLBACK_URL],
      },
      {
        clientId: env.SEED_KEUANGAN_CLIENT_ID,
        clientSecret: env.SEED_KEUANGAN_CLIENT_SECRET,
        name: "Keuangan Platform",
        description: "Sistem Keuangan Terpadu",
        redirectUris: [env.SEED_KEUANGAN_CALLBACK_URL],
      },
      {
        clientId: env.SEED_HRIS_CLIENT_ID,
        clientSecret: env.SEED_HRIS_CLIENT_SECRET,
        name: "HRIS Platform",
        description: "Human Resources Information System",
        redirectUris: [env.SEED_HRIS_CALLBACK_URL],
      }
    ];

    for (const appData of defaultApps) {
      const secretHash = await bcrypt.hash(appData.clientSecret, saltRounds);
      const [insertedApp] = await db.insert(applications).values({
        clientId: appData.clientId,
        clientSecretHash: secretHash,
        name: appData.name,
        description: appData.description,
        redirectUris: appData.redirectUris,
        allowedGrantTypes: ["authorization_code", "refresh_token"],
        status: "active",
      }).returning();

      // 4. Seed Roles per application and assign to users
      if (appData.clientId === "siakad-platform") {
        const [mhsRole] = await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "mahasiswa",
          roleName: "Mahasiswa",
          description: "Student role in SIAKAD",
          isDefault: true,
        }).returning();

        const [dsnRole] = await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "dosen",
          roleName: "Dosen",
          description: "Lecturer role in SIAKAD",
          isDefault: false,
        }).returning();

        await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "kaprodi",
          roleName: "Kaprodi",
          description: "Head of Study Program role in SIAKAD",
          isDefault: false,
        });

        const [adminRole] = await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "admin",
          roleName: "Admin",
          description: "Administrator in SIAKAD",
          isDefault: false,
        }).returning();

        // Assignments
        await db.insert(userApplicationRoles).values({
          userId: adminUser!.id,
          applicationId: insertedApp!.id,
          roleId: adminRole!.id,
          status: "active",
        });

        await db.insert(userApplicationRoles).values({
          userId: mahasiswaUser!.id,
          applicationId: insertedApp!.id,
          roleId: mhsRole!.id,
          status: "active",
        });

        await db.insert(userApplicationRoles).values({
          userId: dosenUser!.id,
          applicationId: insertedApp!.id,
          roleId: dsnRole!.id,
          status: "active",
        });
      } else if (appData.clientId === "lms-platform") {
        const [mhsRole] = await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "mahasiswa",
          roleName: "Mahasiswa",
          description: "Student role in LMS",
          isDefault: true,
        }).returning();

        const [dsnRole] = await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "dosen",
          roleName: "Dosen",
          description: "Lecturer role in LMS",
          isDefault: false,
        }).returning();

        await db.insert(userApplicationRoles).values({
          userId: adminUser!.id,
          applicationId: insertedApp!.id,
          roleId: mhsRole!.id,
          status: "active",
        });

        await db.insert(userApplicationRoles).values({
          userId: mahasiswaUser!.id,
          applicationId: insertedApp!.id,
          roleId: mhsRole!.id,
          status: "active",
        });

        await db.insert(userApplicationRoles).values({
          userId: dosenUser!.id,
          applicationId: insertedApp!.id,
          roleId: dsnRole!.id,
          status: "active",
        });
      } else if (appData.clientId === "pmb-platform") {
        const [adminRole] = await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "admin",
          roleName: "Admin PMB",
          description: "Administrator role in PMB",
          isDefault: false,
        }).returning();

        const [pendaftarRole] = await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "pendaftar",
          roleName: "Pendaftar",
          description: "Applicant role in PMB",
          isDefault: true,
        }).returning();

        // Assign adminUser to adminRole
        await db.insert(userApplicationRoles).values({
          userId: adminUser!.id,
          applicationId: insertedApp!.id,
          roleId: adminRole!.id,
          status: "active",
        });

        // Assign mahasiswaUser to pendaftarRole
        await db.insert(userApplicationRoles).values({
          userId: mahasiswaUser!.id,
          applicationId: insertedApp!.id,
          roleId: pendaftarRole!.id,
          status: "active",
        });
      } else if (appData.clientId === "keuangan-platform") {
        const [kepalaBiroRole] = await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "kepala_biro",
          roleName: "Kepala Biro Keuangan",
          description: "Chief Financial Officer",
          isDefault: false,
        }).returning();

        const [stafPenerimaanRole] = await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "staf_penerimaan",
          roleName: "Staf Penerimaan",
          description: "Receivables staff",
          isDefault: false,
        }).returning();

        await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "staf_pengeluaran",
          roleName: "Staf Pengeluaran",
          description: "Payables and PO staff",
          isDefault: false,
        });

        await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "staf_akuntansi",
          roleName: "Staf Akuntansi",
          description: "Ledger and CoA staff",
          isDefault: false,
        });

        const [mahasiswaRole] = await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "mahasiswa",
          roleName: "Mahasiswa",
          description: "Student finance access",
          isDefault: true,
        }).returning();

        // Assign adminUser to kepalaBiroRole
        await db.insert(userApplicationRoles).values({
          userId: adminUser!.id,
          applicationId: insertedApp!.id,
          roleId: kepalaBiroRole!.id,
          status: "active",
        });

        // Assign mahasiswaUser to mahasiswaRole
        await db.insert(userApplicationRoles).values({
          userId: mahasiswaUser!.id,
          applicationId: insertedApp!.id,
          roleId: mahasiswaRole!.id,
          status: "active",
        });

        // Assign dosenUser to stafPenerimaanRole
        await db.insert(userApplicationRoles).values({
          userId: dosenUser!.id,
          applicationId: insertedApp!.id,
          roleId: stafPenerimaanRole!.id,
          status: "active",
        });
      } else if (appData.clientId === "hris-platform") {
        const [superAdminSdmRole] = await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "super_admin_sdm",
          roleName: "Super Admin SDM",
          description: "Full configuration control of HRIS",
          isDefault: false,
        }).returning();

        await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "admin_data_sdm",
          roleName: "Admin Data SDM",
          description: "Employee directories management",
          isDefault: false,
        });

        await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "admin_payroll",
          roleName: "Admin Payroll & Pajak",
          description: "Payroll calculations and tax filings",
          isDefault: false,
        });

        await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "approver",
          roleName: "Approver SDM",
          description: "Line managers and approvers",
          isDefault: false,
        });

        const [pegawaiRole] = await db.insert(applicationRoles).values({
          applicationId: insertedApp!.id,
          roleKey: "pegawai",
          roleName: "Pegawai",
          description: "Standard employee access",
          isDefault: true,
        }).returning();

        // Assign adminUser to superAdminSdmRole
        await db.insert(userApplicationRoles).values({
          userId: adminUser!.id,
          applicationId: insertedApp!.id,
          roleId: superAdminSdmRole!.id,
          status: "active",
        });

        // Assign mahasiswaUser to pegawaiRole
        await db.insert(userApplicationRoles).values({
          userId: mahasiswaUser!.id,
          applicationId: insertedApp!.id,
          roleId: pegawaiRole!.id,
          status: "active",
        });
      }
    }

    console.log("SSO Platform Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding SSO Database:", error);
  }
}
