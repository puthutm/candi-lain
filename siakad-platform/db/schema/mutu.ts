import { pgTable, uuid, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { siakadStudyPrograms } from "./master";

export const siakadAccreditationCriteria = pgTable("siakad_accreditation_criteria", {
  id: uuid("id").primaryKey().defaultRandom(),
  studyProgramId: uuid("study_program_id").references(() => siakadStudyPrograms.id, { onDelete: "cascade" }).notNull(),
  criteriaNumber: integer("criteria_number").notNull(), // 1 - 9 BAN-PT
  criteriaName: text("criteria_name").notNull(),
  targetScore: numeric("target_score", { precision: 4, scale: 2 }).notNull(),
  currentScore: numeric("current_score", { precision: 4, scale: 2 }).default("0.00").notNull(),
  evidenceFileUrl: text("evidence_file_url"),
  status: text("status", { enum: ["kurang", "baik", "sangat_baik"] }).default("kurang").notNull(),
});

import { integer } from "drizzle-orm/pg-core"; // Helper import alignment

export const siakadPddiktiSyncLogs = pgTable("siakad_pddikti_sync_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableName: text("table_name").notNull(),
  rowCount: integer("row_count").default(0).notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
  status: text("status", { enum: ["sukses", "gagal", "berjalan"] }).default("berjalan").notNull(),
});

export const siakadAuditLogs = pgTable("siakad_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorRef: text("actor_ref").notNull(), // Refers to SSO users.id
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: text("action").notNull(),
  detail: jsonb("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
