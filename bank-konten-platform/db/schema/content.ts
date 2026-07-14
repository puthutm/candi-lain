import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, decimal, pgEnum } from "drizzle-orm/pg-core";

export const materialTypeEnum = pgEnum("material_type", ["dokumen", "video", "presentasi", "dataset"]);
export const verificationStatusEnum = pgEnum("verification_status", ["draft", "menunggu_prodi", "menunggu_bpm", "terbit", "revisi", "arsip"]);
export const questionTypeEnum = pgEnum("question_type", ["pilihan_ganda", "esai", "pilihan_ganda_kompleks"]);
export const difficultyLevelEnum = pgEnum("difficulty_level", ["mudah", "sedang", "sulit"]);
export const bloomTaxonomyEnum = pgEnum("bloom_taxonomy", ["C1", "C2", "C3", "C4", "C5", "C6"]);
export const qualityFlagEnum = pgEnum("quality_flag", ["baik", "perlu_revisi", "belum_dianalisis"]);
export const consumerSystemEnum = pgEnum("consumer_system", ["pmb", "siakad", "lms"]);

// Cache / Local representation of courses from SIAKAD
export const bankCourses = pgTable("bank_courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").unique().notNull(), // MK Code (e.g. INF-201)
  name: text("name").notNull(),
  faculty: text("faculty").notNull(),
  degreeLevel: text("degree_level").notNull(), // S1, S2 etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================= BANK MATERI =================

export const materialBankItems = pgTable("material_bank_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  courseCode: text("course_code").references(() => bankCourses.code).notNull(),
  topic: text("topic").notNull(),
  tags: jsonb("tags").$type<string[]>(),
  materialType: text("material_type").notNull(), // 'dokumen' | 'video' | 'presentasi' | 'dataset'
  contributorUserId: uuid("contributor_user_id").notNull(),
  currentVersionNumber: integer("current_version_number").default(1).notNull(),
  verificationStatus: text("verification_status").default("draft").notNull(), // 'draft' | 'menunggu_prodi' | 'menunggu_bpm' | 'terbit' | 'revisi' | 'arsip'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const materialBankVersions = pgTable("material_bank_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  materialItemId: uuid("material_item_id").references(() => materialBankItems.id).notNull(),
  versionNumber: integer("version_number").notNull(),
  fileUrl: text("file_url").notNull(),
  changelog: text("changelog"),
  uploadedByUserId: uuid("uploaded_by_user_id").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const materialUsageLogs = pgTable("material_usage_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  materialItemId: uuid("material_item_id").references(() => materialBankItems.id).notNull(),
  consumerSystem: text("consumer_system").notNull(), // 'lms' | 'siakad' | 'pmb'
  consumerClassRef: text("consumer_class_ref").notNull(),
  usedByUserId: uuid("used_by_user_id").notNull(),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

// ================= BANK SOAL =================

export const questionBankItems = pgTable("question_bank_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseCode: text("course_code").references(() => bankCourses.code).notNull(),
  topic: text("topic").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // 'pilihan_ganda' | 'esai' | 'pilihan_ganda_kompleks'
  correctAnswer: text("correct_answer").notNull(),
  difficultyLevel: text("difficulty_level").default("sedang").notNull(), // 'mudah' | 'sedang' | 'sulit'
  bloomTaxonomy: text("bloom_taxonomy").default("C1").notNull(), // 'C1' to 'C6'
  tags: jsonb("tags").$type<string[]>(),
  contributorUserId: uuid("contributor_user_id").notNull(),
  currentVersionNumber: integer("current_version_number").default(1).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  verificationStatus: text("verification_status").default("draft").notNull(), // 'draft' | 'menunggu_prodi' | 'menunggu_bpm' | 'terbit' | 'revisi' | 'arsip'
  qualityFlag: text("quality_flag").default("belum_dianalisis").notNull(), // 'baik' | 'perlu_revisi' | 'belum_dianalisis'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questionBankOptions = pgTable("question_bank_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").references(() => questionBankItems.id, { onDelete: "cascade" }).notNull(),
  optionLabel: text("option_label").notNull(), // 'A', 'B', 'C', 'D', 'E'
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").default(false).notNull(),
});

export const questionBankVersions = pgTable("question_bank_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").references(() => questionBankItems.id).notNull(),
  versionNumber: integer("version_number").notNull(),
  questionTextSnapshot: text("question_text_snapshot").notNull(),
  changelog: text("changelog"),
  revisedByUserId: uuid("revised_by_user_id").notNull(),
  revisedAt: timestamp("revised_at").defaultNow().notNull(),
});

export const questionUsageLogs = pgTable("question_usage_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").references(() => questionBankItems.id).notNull(),
  consumerSystem: text("consumer_system").notNull(), // 'pmb' | 'siakad' | 'lms'
  consumerExamRef: text("consumer_exam_ref").notNull(),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

export const questionItemAnalysis = pgTable("question_item_analysis", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").references(() => questionBankItems.id).notNull(),
  consumerSystem: text("consumer_system").notNull(),
  consumerExamRef: text("consumer_exam_ref").notNull(),
  respondentCount: integer("respondent_count").notNull(),
  correctRate: decimal("correct_rate", { precision: 5, scale: 2 }).notNull(), // actual difficulty, e.g. 0.75 for 75% correct
  discriminationIndex: decimal("discrimination_index", { precision: 3, scale: 2 }).notNull(),
  computedAt: timestamp("computed_at").defaultNow().notNull(),
});

export const quizGenerationRules = pgTable("quiz_generation_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  courseCode: text("course_code").references(() => bankCourses.code).notNull(),
  totalQuestions: integer("total_questions").notNull(),
  difficultyDistribution: jsonb("difficulty_distribution").notNull(), // e.g. { mudah: 30, sedang: 50, sulit: 20 }
  tagFilter: jsonb("tag_filter"),
  excludeIfUsedWithinDays: integer("exclude_if_used_within_days").default(30).notNull(),
  createdByUserId: uuid("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================= VERIFIKASI BERJENJANG (SHARED) =================

export const verificationRecords = pgTable("verification_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  contentType: text("content_type").notNull(), // 'materi' | 'soal'
  contentId: uuid("content_id").notNull(), // ref materialBankItems.id OR questionBankItems.id
  stage: text("stage").notNull(), // 'prodi' | 'bpm'
  decision: text("decision").notNull(), // 'setuju' | 'revisi'
  verifierUserId: uuid("verifier_user_id").notNull(),
  note: text("note"),
  decidedAt: timestamp("decided_at").defaultNow().notNull(),
});

// ================= AUDIT LOGS =================

export const auditLogs = pgTable("bank_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorRef: uuid("actor_ref").notNull(), // ref SSO_USERS
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: text("action").notNull(),
  detail: jsonb("detail"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
