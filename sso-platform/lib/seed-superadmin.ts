import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { env } from "./env";

/**
 * Seed Superadmin User
 * 
 * This script creates or updates the superadmin user in the SSO database.
 * It also ensures the `photo_url` column exists in the users table.
 * 
 * Usage:
 *   npx tsx lib/seed-superadmin.ts
 * 
 * Environment variables used:
 *   - SUPERADMIN_PASSWORD (default: "password123")
 *   - SUPER_ADMIN_EMAIL (default: "admin@example.com")
 *   - BCRYPT_ROUNDS (default: 12)
 */

async function ensurePhotoUrlColumn() {
  try {
    // Check if photo_url column exists
    const result = await db.execute(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'photo_url'
    `);
    
    if (result.length === 0) {
      console.log("📦 Adding photo_url column to users table...");
      await db.execute(`ALTER TABLE "users" ADD COLUMN "photo_url" text;`);
      console.log("✅ photo_url column added successfully.");
    } else {
      console.log("✅ photo_url column already exists.");
    }
  } catch (error) {
    console.error("❌ Failed to check/add photo_url column:", error);
    throw error;
  }
}

async function seedSuperadmin() {
  console.log("🚀 Starting Superadmin Seeder...\n");

  try {
    // Step 1: Ensure photo_url column exists
    await ensurePhotoUrlColumn();

    // Step 2: Prepare superadmin data
    const saltRounds = env.BCRYPT_ROUNDS || 12;
    const superadminPassword = env.SUPERADMIN_PASSWORD || "password123";
    const adminEmail = env.SUPER_ADMIN_EMAIL || "admin@example.com";

    const superadminData = {
      username: "superadmin",
      email: "superadmin@example.com",
      passwordHash: await bcrypt.hash(superadminPassword, saltRounds),
      fullName: "Super Administrator",
      status: "active" as const,
      photoUrl: null,
    };

    // Step 3: Check if superadmin already exists
    const existingSuperadmin = await db
      .select()
      .from(users)
      .where(eq(users.username, "superadmin"))
      .limit(1);

    if (existingSuperadmin.length === 0) {
      // Create new superadmin
      console.log("📝 Creating new superadmin user...");
      const [inserted] = await db
        .insert(users)
        .values(superadminData)
        .returning();

      console.log(`✅ Superadmin created successfully:`);
      console.log(`   - ID: ${inserted.id}`);
      console.log(`   - Username: ${inserted.username}`);
      console.log(`   - Email: ${inserted.email}`);
      console.log(`   - Full Name: ${inserted.fullName}`);
    } else {
      // Update existing superadmin
      const existing = existingSuperadmin[0];
      console.log("📝 Updating existing superadmin user...");
      
      const [updated] = await db
        .update(users)
        .set({
          passwordHash: superadminData.passwordHash,
          fullName: superadminData.fullName,
          email: superadminData.email,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
        .returning();

      console.log(`✅ Superadmin updated successfully:`);
      console.log(`   - ID: ${updated.id}`);
      console.log(`   - Username: ${updated.username}`);
      console.log(`   - Email: ${updated.email}`);
      console.log(`   - Full Name: ${updated.fullName}`);
    }

    // Step 4: Also ensure admin user exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"))
      .limit(1);

    if (existingAdmin.length === 0) {
      console.log("\n📝 Creating admin user...");
      const adminPassword = env.SUPER_ADMIN_PASSWORD || "password123";
      const adminPasswordHash = await bcrypt.hash(adminPassword, saltRounds);

      const [inserted] = await db
        .insert(users)
        .values({
          username: "admin",
          email: adminEmail,
          passwordHash: adminPasswordHash,
          fullName: "Super Admin",
          status: "active",
          photoUrl: null,
        })
        .returning();

      console.log(`✅ Admin created successfully:`);
      console.log(`   - ID: ${inserted.id}`);
      console.log(`   - Username: ${inserted.username}`);
      console.log(`   - Email: ${inserted.email}`);
    } else {
      console.log("\n✅ Admin user already exists.");
    }

    console.log("\n🎉 Superadmin seeder completed successfully!");
    console.log("\n📋 Login credentials:");
    console.log("   Superadmin:");
    console.log(`     Username: superadmin`);
    console.log(`     Password: ${env.SUPERADMIN_PASSWORD ? "*** (from env)" : "password123"}`);
    console.log("   Admin:");
    console.log(`     Username: admin`);
    console.log(`     Password: ${env.SUPER_ADMIN_PASSWORD ? "*** (from env)" : "password123"}`);

  } catch (error) {
    console.error("\n❌ Superadmin seeder failed:", error);
    process.exit(1);
  }
}

// Run the seeder
seedSuperadmin();
