import { pgTable, uuid, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";

/**
 * Master Program Beasiswa
 * FR-4.1: Kelola program beasiswa (KIP-K, Internal, Mitra)
 */
export const scholarshipPrograms = pgTable("scholarship_programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  fundingSource: text("funding_source", {
    enum: ["kip_k", "internal", "mitra"],
  }).notNull(),
  quota: integer("quota").default(0).notNull(),
  nominalPerSemester: numeric("nominal_per_semester", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  status: text("status", { enum: ["aktif", "nonaktif"] }).default("aktif").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Penerima Beasiswa per Semester
 * FR-4.2: Pembebanan otomatis ke tagihan SPP
 */
export const scholarshipRecipients = pgTable("scholarship_recipients", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id").references(() => scholarshipPrograms.id, { onDelete: "cascade" }).notNull(),
  studentUserId: uuid("student_user_id").notNull(),
  studentNameSnapshot: text("student_name_snapshot"),
  academicPeriod: text("academic_period").notNull(),
  nominalAwarded: numeric("nominal_awarded", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: ["aktif", "selesai", "dicabut"] }).default("aktif").notNull(),
  invoiceId: uuid("invoice_id"), // link ke invoice yang dibebani
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Pencairan Dana Beasiswa dari sumber (Kemendikbud/Yayasan/Mitra)
 * FR-4.3: Alur dana beasiswa
 */
export const scholarshipDisbursements = pgTable("scholarship_disbursements", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id").references(() => scholarshipPrograms.id).notNull(),
  fundingSource: text("funding_source", {
    enum: ["kip_k", "internal", "mitra"],
  }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  disbursementDate: timestamp("disbursement_date", { withTimezone: true }).defaultNow().notNull(),
  destinationBankAccount: text("destination_bank_account"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
