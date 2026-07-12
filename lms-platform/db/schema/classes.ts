import { pgTable, uuid, text, integer, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";

export const lmsClassTypeEnum = pgEnum("lms_class_type", ["akademik", "personal"]);
export const lmsLearningModeEnum = pgEnum("lms_learning_mode", ["sync", "async", "hybrid"]);
export const lmsPersonalAccessTypeEnum = pgEnum("lms_personal_access_type", ["undang", "kode_akses", "publik"]);
export const lmsEnrollmentRoleEnum = pgEnum("lms_enrollment_role", ["mahasiswa", "observer", "asisten"]);

export const lmsClasses = pgTable("lms_classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  classType: lmsClassTypeEnum("class_type").default("akademik").notNull(),
  siakadClassId: uuid("siakad_class_id"), // Logical ref to SIAKAD classes.id, nullable for personal
  courseCode: text("course_code").notNull(),
  courseName: text("course_name").notNull(),
  sks: integer("sks").notNull(),
  academicPeriodLabel: text("academic_period_label"),
  scheduleText: text("schedule_text"),
  learningMode: lmsLearningModeEnum("learning_mode").default("async").notNull(),
  dosenUserId: uuid("dosen_user_id").notNull(), // SSO User ID ref
  rpsDescription: text("rps_description"),
  cpmkList: jsonb("cpmk_list"),
  pustakaAcuan: jsonb("pustaka_acuan"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  personalAccessType: lmsPersonalAccessTypeEnum("personal_access_type"),
  personalAccessCode: text("personal_access_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const classEnrollments = pgTable("lms_class_enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references(() => lmsClasses.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").notNull(), // SSO User ID ref
  role: lmsEnrollmentRoleEnum("role").default("mahasiswa").notNull(),
  krsItemRef: uuid("krs_item_ref"), // logical ref to SIAKAD krs_items.id
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow().notNull(),
});
