import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const pmbFeeRates = pgTable("pmb_fee_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  waveLabel: text("wave_label").notNull(),
  registrationFee: numeric("registration_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  examFee: numeric("exam_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  reregistrationFee: numeric("reregistration_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  matriculationFee: numeric("matriculation_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * FR-3.3: Data pendaftar PMB yang disinkron dari SI-PMB (read-only di Keuangan)
 */
export const pmbApplicants = pgTable("pmb_applicants", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  fullName: text("full_name").notNull(),
  waveLabel: text("wave_label").notNull(),
  studyProgramChoice: text("study_program_choice"),
  registrationStatus: text("registration_status", {
    enum: ["pendaftar", "bayar_formulir", "ikut_ujian", "lulus_seleksi", "daftar_ulang"],
  }).default("pendaftar").notNull(),
  paymentStatus: text("payment_status", {
    enum: ["belum_bayar", "lunas_formulir", "lunas_ujian", "lunas_daftar_ulang", "lunas"],
  }).default("belum_bayar").notNull(),
  syncSource: text("sync_source").default("si-pmb").notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
