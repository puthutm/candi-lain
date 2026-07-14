import { NextResponse } from "next/server";
import { db, postgresClient } from "@/db";
import { ssoApplications, ssoApplicationRoles } from "@/db/schema/sso";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function GET() {
  try {
    console.log("Setting up Bank Konten tables...");

    // 1. Create tables using raw DDL queries
    await postgresClient`
      CREATE TABLE IF NOT EXISTS bank_courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        faculty TEXT NOT NULL,
        degree_level TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await postgresClient`
      CREATE TABLE IF NOT EXISTS material_bank_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        course_code TEXT NOT NULL REFERENCES bank_courses(code),
        topic TEXT NOT NULL,
        tags JSONB,
        material_type TEXT NOT NULL,
        contributor_user_id UUID NOT NULL,
        current_version_number INTEGER DEFAULT 1 NOT NULL,
        verification_status TEXT DEFAULT 'draft' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await postgresClient`
      CREATE TABLE IF NOT EXISTS material_bank_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        material_item_id UUID NOT NULL REFERENCES material_bank_items(id),
        version_number INTEGER NOT NULL,
        file_url TEXT NOT NULL,
        changelog TEXT,
        uploaded_by_user_id UUID NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await postgresClient`
      CREATE TABLE IF NOT EXISTS material_usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        material_item_id UUID NOT NULL REFERENCES material_bank_items(id),
        consumer_system TEXT NOT NULL,
        consumer_class_ref TEXT NOT NULL,
        used_by_user_id UUID NOT NULL,
        used_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await postgresClient`
      CREATE TABLE IF NOT EXISTS question_bank_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_code TEXT NOT NULL REFERENCES bank_courses(code),
        topic TEXT NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        difficulty_level TEXT DEFAULT 'sedang' NOT NULL,
        bloom_taxonomy TEXT DEFAULT 'C1' NOT NULL,
        tags JSONB,
        contributor_user_id UUID NOT NULL,
        current_version_number INTEGER DEFAULT 1 NOT NULL,
        usage_count INTEGER DEFAULT 0 NOT NULL,
        last_used_at TIMESTAMP,
        verification_status TEXT DEFAULT 'draft' NOT NULL,
        quality_flag TEXT DEFAULT 'belum_dianalisis' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await postgresClient`
      CREATE TABLE IF NOT EXISTS question_bank_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL REFERENCES question_bank_items(id) ON DELETE CASCADE,
        option_label TEXT NOT NULL,
        option_text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT false NOT NULL
      )
    `;

    await postgresClient`
      CREATE TABLE IF NOT EXISTS question_bank_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL REFERENCES question_bank_items(id),
        version_number INTEGER NOT NULL,
        question_text_snapshot TEXT NOT NULL,
        changelog TEXT,
        revised_by_user_id UUID NOT NULL,
        revised_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await postgresClient`
      CREATE TABLE IF NOT EXISTS question_usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL REFERENCES question_bank_items(id),
        consumer_system TEXT NOT NULL,
        consumer_exam_ref TEXT NOT NULL,
        used_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await postgresClient`
      CREATE TABLE IF NOT EXISTS question_item_analysis (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL REFERENCES question_bank_items(id),
        consumer_system TEXT NOT NULL,
        consumer_exam_ref TEXT NOT NULL,
        respondent_count INTEGER NOT NULL,
        correct_rate DECIMAL(5, 2) NOT NULL,
        discrimination_index DECIMAL(3, 2) NOT NULL,
        computed_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await postgresClient`
      CREATE TABLE IF NOT EXISTS quiz_generation_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        course_code TEXT NOT NULL REFERENCES bank_courses(code),
        total_questions INTEGER NOT NULL,
        difficulty_distribution JSONB NOT NULL,
        tag_filter JSONB,
        exclude_if_used_within_days INTEGER DEFAULT 30 NOT NULL,
        created_by_user_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await postgresClient`
      CREATE TABLE IF NOT EXISTS verification_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_type TEXT NOT NULL,
        content_id UUID NOT NULL,
        stage TEXT NOT NULL,
        decision TEXT NOT NULL,
        verifier_user_id UUID NOT NULL,
        note TEXT,
        decided_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await postgresClient`
      CREATE TABLE IF NOT EXISTS bank_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_ref UUID NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id UUID NOT NULL,
        action TEXT NOT NULL,
        detail JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    console.log("Database tables verified/created successfully.");

    // 2. Register SSO Application
    const client_id = "bank-konten-platform";
    let [app] = await db
      .select()
      .from(ssoApplications)
      .where(eq(ssoApplications.clientId, client_id))
      .limit(1);

    if (!app) {
      const appId = crypto.randomUUID();
      [app] = await db
        .insert(ssoApplications)
        .values({
          id: appId,
          name: "Bank Konten Akademik",
          clientId: client_id,
        })
        .returning();
      console.log("SSO application registered.");
    }

    // 3. Register SSO Application Roles
    const roles = [
      { key: "dosen", name: "Dosen Kontributor" },
      { key: "verifikator_prodi", name: "Verifikator Program Studi" },
      { key: "verifikator_bpm", name: "Verifikator BPM" },
      { key: "admin_bank_konten", name: "Administrator Bank Konten" },
    ];

    for (const role of roles) {
      const existing = await postgresClient`
        SELECT 1 FROM application_roles 
        WHERE application_id = ${app.id} AND role_key = ${role.key}
      `;
      if (existing.length === 0) {
        await postgresClient`
          INSERT INTO application_roles (id, application_id, role_key, role_name)
          VALUES (${crypto.randomUUID()}, ${app.id}, ${role.key}, ${role.name})
        `;
      }
    }
    console.log("SSO application roles verified.");

    // 4. Sync Initial Courses from SIAKAD
    const siakadCoursesExist = await postgresClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'siakad_courses'
      )
    `;

    if (siakadCoursesExist[0]?.exists) {
      const courses = await postgresClient`
        SELECT code, name FROM siakad_courses
      `;
      for (const c of courses) {
        await postgresClient`
          INSERT INTO bank_courses (code, name, faculty, degree_level)
          VALUES (${c.code}, ${c.name}, 'Teknologi Informasi', 'S1')
          ON CONFLICT (code) DO NOTHING
        `;
      }
      console.log(`Synced ${courses.length} courses from SIAKAD.`);
    } else {
      // Fallback Seed if siakad_courses is not initialized
      const dummyCourses = [
        { code: "INF-101", name: "Dasar Pemrograman" },
        { code: "INF-201", name: "Struktur Data & Algoritma" },
        { code: "INF-302", name: "Rekayasa Perangkat Lunak" },
        { code: "INF-401", name: "Kecerdasan Buatan" },
      ];
      for (const c of dummyCourses) {
        await postgresClient`
          INSERT INTO bank_courses (code, name, faculty, degree_level)
          VALUES (${c.code}, ${c.name}, 'Teknologi Informasi', 'S1')
          ON CONFLICT (code) DO NOTHING
        `;
      }
      console.log("Seeded default fallback courses.");
    }

    return NextResponse.json({ success: true, message: "Bank Konten platform initialized successfully!" });
  } catch (error: any) {
    console.error("Setup failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
