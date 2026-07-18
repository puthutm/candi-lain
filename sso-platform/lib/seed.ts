import { db } from "@/db";
import { users } from "@/db/schema/users";
import { applications, scopes } from "@/db/schema/applications";
import { applicationRoles, userApplicationRoles } from "@/db/schema/rbac";
import { refCategories, refItems, organizations, userOrganizations } from "@/db/schema/reference";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import { env } from "./env";

async function getOrInsertRole(applicationId: string, roleKey: string, roleName: string, description: string, isDefault: boolean) {
  const existing = await db
    .select()
    .from(applicationRoles)
    .where(
      and(
        eq(applicationRoles.applicationId, applicationId),
        eq(applicationRoles.roleKey, roleKey)
      )
    )
    .limit(1);
  if (existing.length === 0) {
    const [inserted] = await db.insert(applicationRoles).values({
      applicationId,
      roleKey,
      roleName,
      description,
      isDefault,
    }).returning();
    return inserted;
  }
  return existing[0];
}

async function assignUserRole(userId: string, applicationId: string, roleId: string) {
  const existing = await db
    .select()
    .from(userApplicationRoles)
    .where(
      and(
        eq(userApplicationRoles.userId, userId),
        eq(userApplicationRoles.applicationId, applicationId),
        eq(userApplicationRoles.roleId, roleId)
      )
    )
    .limit(1);
  if (existing.length === 0) {
    await db.insert(userApplicationRoles).values({
      userId,
      applicationId,
      roleId,
      status: "active",
    });
  }
}

export async function ensureDatabaseSeeded(force?: boolean) {
  try {
    const adminEmail = env.SUPER_ADMIN_EMAIL || "admin@example.com";
    
    if (force) {
      console.log("Force option enabled. Clearing database tables...");
      await db.delete(userApplicationRoles);
      await db.delete(applicationRoles);
      await db.delete(applications);
      await db.delete(users);
      await db.delete(scopes);
    }

    console.log("Seeding SSO Platform Database (Idempotent)...");

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
    let adminUser;
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
    if (existingAdmin.length === 0) {
      const adminPasswordHash = await bcrypt.hash(env.SUPER_ADMIN_PASSWORD || "admin-password-123", saltRounds);
      const [inserted] = await db.insert(users).values({
        username: "admin",
        email: adminEmail,
        passwordHash: adminPasswordHash,
        fullName: "Super Admin",
        status: "active",
      }).returning();
      adminUser = inserted;
    } else {
      adminUser = existingAdmin[0];
    }

    // mahasiswa
    let mahasiswaUser;
    const existingMahasiswa = await db.select().from(users).where(eq(users.username, "mahasiswa")).limit(1);
    if (existingMahasiswa.length === 0) {
      const mahasiswapsd = "mahasiswa-password-123";
      const mahasiswaPasswordHash = await bcrypt.hash(mahasiswapsd, saltRounds);
      const [inserted] = await db.insert(users).values({
        username: "mahasiswa",
        email: "mahasiswa@example.com",
        passwordHash: mahasiswaPasswordHash,
        fullName: "Budi Santoso",
        status: "active",
      }).returning();
      mahasiswaUser = inserted;
    } else {
      mahasiswaUser = existingMahasiswa[0];
    }

    // dosen
    let dosenUser;
    const existingDosen = await db.select().from(users).where(eq(users.username, "dosen")).limit(1);
    if (existingDosen.length === 0) {
      const dosenpsd = "dosen-password-123";
      const dosenPasswordHash = await bcrypt.hash(dosenpsd, saltRounds);
      const [inserted] = await db.insert(users).values({
        username: "dosen",
        email: "dosen@example.com",
        passwordHash: dosenPasswordHash,
        fullName: "Dr. Hendra Setiawan, M.Kom.",
        status: "active",
      }).returning();
      dosenUser = inserted;
    } else {
      dosenUser = existingDosen[0];
    }

    // 3. Seed Applications
    const baseDomain = process.env.SEED_DOMAIN_BASE;
    const protocol = process.env.SEED_DOMAIN_PROTOCOL || "http";

    const getRedirectUris = (defaultUri: string, subdomainPrefix: string) => {
      if (baseDomain) {
        return [`${protocol}://${subdomainPrefix}.${baseDomain}/api/auth/callback`];
      }
      return [defaultUri];
    };

    const defaultApps = [
      {
        clientId: env.SEED_SIAKAD_CLIENT_ID,
        clientSecret: env.SEED_SIAKAD_CLIENT_SECRET,
        name: "SIAKAD Platform",
        description: "Sistem Informasi Akademik",
        redirectUris: getRedirectUris(env.SEED_SIAKAD_CALLBACK_URL, "siakad"),
      },
      {
        clientId: env.SEED_LMS_CLIENT_ID,
        clientSecret: env.SEED_LMS_CLIENT_SECRET,
        name: "LMS Platform",
        description: "Learning Management System",
        redirectUris: getRedirectUris(env.SEED_LMS_CALLBACK_URL, "lms"),
      },
      {
        clientId: env.SEED_PMB_CLIENT_ID,
        clientSecret: env.SEED_PMB_CLIENT_SECRET,
        name: "PMB Platform",
        description: "Penerimaan Mahasiswa Baru",
        redirectUris: getRedirectUris(env.SEED_PMB_CALLBACK_URL, "pmb"),
      },
      {
        clientId: env.SEED_KEUANGAN_CLIENT_ID,
        clientSecret: env.SEED_KEUANGAN_CLIENT_SECRET,
        name: "Keuangan Platform",
        description: "Sistem Keuangan Terpadu",
        redirectUris: getRedirectUris(env.SEED_KEUANGAN_CALLBACK_URL, "keuangan"),
      },
      {
        clientId: env.SEED_HRIS_CLIENT_ID,
        clientSecret: env.SEED_HRIS_CLIENT_SECRET,
        name: "HRIS Platform",
        description: "Human Resources Information System",
        redirectUris: getRedirectUris(env.SEED_HRIS_CALLBACK_URL, "hris"),
      },
      {
        clientId: env.SEED_BANK_KONTEN_CLIENT_ID,
        clientSecret: env.SEED_BANK_KONTEN_CLIENT_SECRET,
        name: "Bank Konten Platform",
        description: "Bank Soal dan Materi Konten",
        redirectUris: getRedirectUris(env.SEED_BANK_KONTEN_CALLBACK_URL, "bank-konten"),
      }
    ];

    for (const appData of defaultApps) {
      let insertedApp;
      const existingApp = await db.select().from(applications).where(eq(applications.clientId, appData.clientId)).limit(1);
      if (existingApp.length === 0) {
        const secretHash = await bcrypt.hash(appData.clientSecret, saltRounds);
        const [inserted] = await db.insert(applications).values({
          clientId: appData.clientId,
          clientSecretHash: secretHash,
          name: appData.name,
          description: appData.description,
          redirectUris: appData.redirectUris,
          allowedGrantTypes: ["authorization_code", "refresh_token"],
          status: "active",
        }).returning();
        insertedApp = inserted;
      } else {
        insertedApp = existingApp[0];
      }

      if (!insertedApp) continue;

      // 4. Seed Roles per application and assign to users
      if (appData.clientId === "siakad-platform") {
        const mhsRole = await getOrInsertRole(insertedApp.id, "mahasiswa", "Mahasiswa", "Student role in SIAKAD", true);
        const dsnRole = await getOrInsertRole(insertedApp.id, "dosen", "Dosen", "Lecturer role in SIAKAD", false);
        await getOrInsertRole(insertedApp.id, "kaprodi", "Kaprodi", "Head of Study Program role in SIAKAD", false);
        const adminRole = await getOrInsertRole(insertedApp.id, "admin", "Admin", "Administrator in SIAKAD", false);

        // Assignments
        if (adminUser && adminRole) await assignUserRole(adminUser.id, insertedApp.id, adminRole.id);
        if (mahasiswaUser && mhsRole) await assignUserRole(mahasiswaUser.id, insertedApp.id, mhsRole.id);
        if (dosenUser && dsnRole) await assignUserRole(dosenUser.id, insertedApp.id, dsnRole.id);

      } else if (appData.clientId === "lms-platform") {
        const mhsRole = await getOrInsertRole(insertedApp.id, "mahasiswa", "Mahasiswa", "Student role in LMS", true);
        const dsnRole = await getOrInsertRole(insertedApp.id, "dosen", "Dosen", "Lecturer role in LMS", false);

        if (adminUser && mhsRole) await assignUserRole(adminUser.id, insertedApp.id, mhsRole.id);
        if (mahasiswaUser && mhsRole) await assignUserRole(mahasiswaUser.id, insertedApp.id, mhsRole.id);
        if (dosenUser && dsnRole) await assignUserRole(dosenUser.id, insertedApp.id, dsnRole.id);

      } else if (appData.clientId === "pmb-platform") {
        const adminRole = await getOrInsertRole(insertedApp.id, "admin", "Admin PMB", "Administrator role in PMB", false);
        const pendaftarRole = await getOrInsertRole(insertedApp.id, "pendaftar", "Pendaftar", "Applicant role in PMB", true);
        const verifikatorRole = await getOrInsertRole(insertedApp.id, "verifikator_berkas", "Verifikator Berkas PMB", "Document verification staff in PMB", false);
        const keuanganRole = await getOrInsertRole(insertedApp.id, "staff_keuangan", "Staf Keuangan PMB", "Finance reconciliator staff in PMB", false);
        const marketingRole = await getOrInsertRole(insertedApp.id, "staff_marketing", "Staf Marketing PMB", "Marketing and campaigns staff in PMB", false);

        if (adminUser && adminRole) await assignUserRole(adminUser.id, insertedApp.id, adminRole.id);
        if (mahasiswaUser && pendaftarRole) await assignUserRole(mahasiswaUser.id, insertedApp.id, pendaftarRole.id);
        if (dosenUser && verifikatorRole) await assignUserRole(dosenUser.id, insertedApp.id, verifikatorRole.id);
        if (dosenUser && keuanganRole) await assignUserRole(dosenUser.id, insertedApp.id, keuanganRole.id);
        if (dosenUser && marketingRole) await assignUserRole(dosenUser.id, insertedApp.id, marketingRole.id);

      } else if (appData.clientId === "keuangan-platform") {
        const kepalaBiroRole = await getOrInsertRole(insertedApp.id, "kepala_biro", "Kepala Biro Keuangan", "Chief Financial Officer", false);
        const stafPenerimaanRole = await getOrInsertRole(insertedApp.id, "staf_penerimaan", "Staf Penerimaan", "Receivables staff", false);
        await getOrInsertRole(insertedApp.id, "staf_pengeluaran", "Staf Pengeluaran", "Payables and PO staff", false);
        await getOrInsertRole(insertedApp.id, "staf_akuntansi", "Staf Akuntansi", "Ledger and CoA staff", false);
        const mahasiswaRole = await getOrInsertRole(insertedApp.id, "mahasiswa", "Mahasiswa", "Student finance access", true);

        if (adminUser && kepalaBiroRole) await assignUserRole(adminUser.id, insertedApp.id, kepalaBiroRole.id);
        if (mahasiswaUser && mahasiswaRole) await assignUserRole(mahasiswaUser.id, insertedApp.id, mahasiswaRole.id);
        if (dosenUser && stafPenerimaanRole) await assignUserRole(dosenUser.id, insertedApp.id, stafPenerimaanRole.id);

      } else if (appData.clientId === "hris-platform") {
        const superAdminSdmRole = await getOrInsertRole(insertedApp.id, "super_admin_sdm", "Super Admin SDM", "Full configuration control of HRIS", false);
        await getOrInsertRole(insertedApp.id, "admin_data_sdm", "Admin Data SDM", "Employee directories management", false);
        await getOrInsertRole(insertedApp.id, "admin_payroll", "Admin Payroll & Pajak", "Payroll calculations and tax filings", false);
        await getOrInsertRole(insertedApp.id, "approver", "Approver SDM", "Line managers and approvers", false);
        const pegawaiRole = await getOrInsertRole(insertedApp.id, "pegawai", "Pegawai", "Standard employee access", true);

        if (adminUser && superAdminSdmRole) await assignUserRole(adminUser.id, insertedApp.id, superAdminSdmRole.id);
        if (mahasiswaUser && pegawaiRole) await assignUserRole(mahasiswaUser.id, insertedApp.id, pegawaiRole.id);

      } else if (appData.clientId === "bank-konten-platform") {
        const dosenRole = await getOrInsertRole(insertedApp.id, "dosen", "Dosen", "Lecturer role in Bank Konten", true);
        const verifikatorProdiRole = await getOrInsertRole(insertedApp.id, "verifikator_prodi", "Verifikator Prodi", "Study Program Verifier", false);
        const verifikatorBpmRole = await getOrInsertRole(insertedApp.id, "verifikator_bpm", "Verifikator BPM", "BPM Quality Assurance Verifier", false);
        const adminBankKontenRole = await getOrInsertRole(insertedApp.id, "admin_bank_konten", "Admin Bank Konten", "Administrator role in Bank Soal & Materi", false);

        if (adminUser && adminBankKontenRole) await assignUserRole(adminUser.id, insertedApp.id, adminBankKontenRole.id);
        if (adminUser && verifikatorProdiRole) await assignUserRole(adminUser.id, insertedApp.id, verifikatorProdiRole.id);
        if (adminUser && verifikatorBpmRole) await assignUserRole(adminUser.id, insertedApp.id, verifikatorBpmRole.id);
        if (dosenUser && dosenRole) await assignUserRole(dosenUser.id, insertedApp.id, dosenRole.id);
      }
    }

    // 5. Seed Reference Data Categories & Items
    console.log("Seeding Reference Data (JABATAN)...");
    
    const existingCat = await db.select().from(refCategories).where(eq(refCategories.code, "JABATAN")).limit(1);
    let jabCategory = existingCat[0];
    if (!jabCategory) {
      const [inserted] = await db.insert(refCategories).values({
        code: "JABATAN",
        name: "Jabatan Pegawai & Dosen",
        description: "Kategori referensi untuk jabatan fungsional dan struktural di Universitas Siber Asia"
      }).returning();
      jabCategory = inserted;
    }

    if (!jabCategory) {
      throw new Error("Failed to seed JABATAN category");
    }

    const positionsList = [
      { code: "REKTOR", name: "Rektor", sortOrder: 1 },
      { code: "DEKAN", name: "Dekan Fakultas", sortOrder: 2 },
      { code: "KAPRODI", name: "Ketua Program Studi (Kaprodi)", sortOrder: 3 },
      { code: "DOSEN", name: "Dosen Pengajar", sortOrder: 4 },
      { code: "DIR_KEUANGAN", name: "Kepala Biro Keuangan", sortOrder: 5 },
      { code: "STAFF_KEUANGAN", name: "Staf Keuangan", sortOrder: 6 },
      { code: "DIR_SDM", name: "Kepala Biro Kepegawaian (SDM)", sortOrder: 7 },
      { code: "STAFF_SDM", name: "Staf Kepegawaian", sortOrder: 8 },
      { code: "PANITIA_PMB", name: "Panitia PMB", sortOrder: 9 },
      { code: "STAFF_LMS", name: "Staf Pengelola LMS", sortOrder: 10 }
    ];

    const positionItems: Record<string, string> = {};

    for (const pos of positionsList) {
      const existingItem = await db
        .select()
        .from(refItems)
        .where(
          and(
            eq(refItems.categoryId, jabCategory.id),
            eq(refItems.code, pos.code)
          )
        )
        .limit(1);
      
      if (existingItem.length === 0) {
        const [inserted] = await db.insert(refItems).values({
          categoryId: jabCategory.id,
          code: pos.code,
          name: pos.name,
          sortOrder: pos.sortOrder,
          isActive: true
        }).returning();
        positionItems[pos.code] = inserted.id;
      } else {
        positionItems[pos.code] = existingItem[0].id;
      }
    }

    // 6. Seed Organizations
    console.log("Seeding Organizations Hierarchy...");
    
    const existingRektorat = await db.select().from(organizations).where(eq(organizations.code, "REKTORAT")).limit(1);
    let rektoratOrg = existingRektorat[0];
    if (!rektoratOrg) {
      const [inserted] = await db.insert(organizations).values({
        code: "REKTORAT",
        name: "Rektorat Universitas Siber Asia",
        type: "company",
        isActive: true
      }).returning();
      rektoratOrg = inserted;
    }

    if (!rektoratOrg) {
      throw new Error("Failed to seed REKTORAT organization");
    }

    const divisionsList = [
      { code: "FTI", name: "Fakultas Teknologi Informasi", type: "division", parentId: rektoratOrg.id },
      { code: "BIRO_KEUANGAN", name: "Biro Keuangan & Administrasi", type: "division", parentId: rektoratOrg.id },
      { code: "BIRO_SDM", name: "Biro Kepegawaian & HRD", type: "division", parentId: rektoratOrg.id }
    ];

    const divisionOrgs: Record<string, string> = {};

    for (const div of divisionsList) {
      const existingDiv = await db.select().from(organizations).where(eq(organizations.code, div.code)).limit(1);
      if (existingDiv.length === 0) {
        const [inserted] = await db.insert(organizations).values(div).returning();
        divisionOrgs[div.code] = inserted.id;
      } else {
        divisionOrgs[div.code] = existingDiv[0].id;
      }
    }

    const deptsList = [
      { code: "PRODI_INF", name: "Program Studi Informatika", type: "department", parentId: divisionOrgs["FTI"] },
      { code: "PRODI_SI", name: "Program Studi Sistem Informasi", type: "department", parentId: divisionOrgs["FTI"] },
      { code: "UNIT_PMB", name: "Panitia Penerimaan Mahasiswa Baru", type: "department", parentId: divisionOrgs["BIRO_SDM"] }
    ];

    const deptOrgs: Record<string, string> = {};

    for (const dept of deptsList) {
      const existingDept = await db.select().from(organizations).where(eq(organizations.code, dept.code)).limit(1);
      if (existingDept.length === 0) {
        const [inserted] = await db.insert(organizations).values(dept).returning();
        deptOrgs[dept.code] = inserted.id;
      } else {
        deptOrgs[dept.code] = existingDept[0].id;
      }
    }

    // 7. Seed Sample User Organizations Assignments
    console.log("Seeding User Organizations Mappings...");

    if (adminUser && rektoratOrg && positionItems["REKTOR"]) {
      const existingAdminOrg = await db
        .select()
        .from(userOrganizations)
        .where(
          and(
            eq(userOrganizations.userId, adminUser.id),
            eq(userOrganizations.organizationId, rektoratOrg.id)
          )
        )
        .limit(1);

      if (existingAdminOrg.length === 0) {
        await db.insert(userOrganizations).values({
          userId: adminUser.id,
          organizationId: rektoratOrg.id,
          positionRefItemId: positionItems["REKTOR"],
          isPrimary: true
        });
      }
    }

    if (dosenUser && deptOrgs["PRODI_INF"] && positionItems["DOSEN"]) {
      const existingDosenOrg = await db
        .select()
        .from(userOrganizations)
        .where(
          and(
            eq(userOrganizations.userId, dosenUser.id),
            eq(userOrganizations.organizationId, deptOrgs["PRODI_INF"])
          )
        )
        .limit(1);

      if (existingDosenOrg.length === 0) {
        await db.insert(userOrganizations).values({
          userId: dosenUser.id,
          organizationId: deptOrgs["PRODI_INF"],
          positionRefItemId: positionItems["DOSEN"],
          isPrimary: true
        });
      }
    }

    console.log("SSO Platform Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding SSO Database:", error);
  }
}
