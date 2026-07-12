import { pgTable, uuid, text, boolean, integer, timestamp, date, numeric } from "drizzle-orm/pg-core";

export const pmbWaves = pgTable("pmb_waves", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status", { enum: ["belum_dibuka", "aktif", "tertutup"] }).default("belum_dibuka").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pmbEntryPaths = pgTable("pmb_entry_paths", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // Reguler, Prestasi, Mitra, Beasiswa
  code: text("code").unique().notNull(),
  formFee: numeric("form_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  isFree: boolean("is_free").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pmbStudyPrograms = pgTable("pmb_study_programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  faculty: text("faculty").notNull(),
  degreeLevel: text("degree_level").default("S1").notNull(),
});

export const pmbQuotas = pgTable("pmb_quotas", {
  id: uuid("id").primaryKey().defaultRandom(),
  waveId: uuid("wave_id").references(() => pmbWaves.id, { onDelete: "cascade" }).notNull(),
  studyProgramId: uuid("study_program_id").references(() => pmbStudyPrograms.id, { onDelete: "cascade" }).notNull(),
  quotaTotal: integer("quota_total").default(0).notNull(),
  quotaFilled: integer("quota_filled").default(0).notNull(),
});
