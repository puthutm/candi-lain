import { pgTable, uuid, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";

export const tuitionRates = pgTable("tuition_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  studyProgramRef: uuid("study_program_ref").notNull(),
  studyProgramNameSnapshot: text("study_program_name_snapshot").notNull(),
  academicPeriodLabel: text("academic_period_label").notNull(),
  sppAmount: numeric("spp_amount", { precision: 12, scale: 2 }).notNull(),
  bopAmount: numeric("bop_amount", { precision: 12, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  requiresYayasanApproval: boolean("requires_yayasan_approval").default(false).notNull(),
  effectiveDate: timestamp("effective_date", { withTimezone: true }).defaultNow().notNull(),
});

export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountCode: text("account_code").unique().notNull(),
  accountName: text("account_name").notNull(),
  accountType: text("account_type", { enum: ["aset", "liabilitas", "ekuitas", "pendapatan", "beban"] }).notNull(),
  parentAccountId: uuid("parent_account_id"),
});
