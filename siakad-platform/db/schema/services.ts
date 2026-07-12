import { pgTable, uuid, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { siakadStudents, siakadLecturers } from "./civitas";

export const siakadLetterTypes = pgTable("siakad_letter_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // Surat Aktif Kuliah, Transkrip Sementara, Cuti Akademik
  requiresSignature: boolean("requires_signature").default(true).notNull(),
});

export const siakadLetterRequests = pgTable("siakad_letter_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => siakadStudents.id, { onDelete: "cascade" }).notNull(),
  letterTypeId: uuid("letter_type_id").references(() => siakadLetterTypes.id).notNull(),
  status: text("status", { enum: ["diajukan", "diproses", "selesai", "ditutup"] }).default("diajukan").notNull(),
  resultFileUrl: text("result_file_url"),
  signedByBsre: text("signed_by_bsre"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const siakadAchievements = pgTable("siakad_achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => siakadStudents.id, { onDelete: "cascade" }).notNull(),
  category: text("category", { enum: ["lomba", "organisasi", "sertifikasi", "publikasi"] }).notNull(),
  activityName: text("activity_name").notNull(),
  level: text("level", { enum: ["lokal", "nasional", "internasional"] }).notNull(),
  year: integer("year").notNull(),
  evidenceFileUrl: text("evidence_file_url").notNull(),
  validationStatus: text("validation_status", { enum: ["menunggu", "tervalidasi", "ditolak"] }).default("menunggu").notNull(),
});

export const siakadTheses = pgTable("siakad_theses", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => siakadStudents.id, { onDelete: "cascade" }).notNull(),
  pembimbingId: uuid("pembimbing_id").references(() => siakadLecturers.id),
  title: text("title").notNull(),
  stage: text("stage", { enum: ["proposal", "penelitian", "sidang_akhir"] }).default("proposal").notNull(),
  progressPercent: integer("progress_percent").default(0).notNull(),
  sidangStatus: text("sidang_status", { enum: ["belum_mengusulkan", "terjadwal", "selesai"] }).default("belum_mengusulkan").notNull(),
});
