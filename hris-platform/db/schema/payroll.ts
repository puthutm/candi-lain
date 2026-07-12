import { pgTable, uuid, text, timestamp, boolean, integer, date, bigint } from "drizzle-orm/pg-core";
import { employees } from "./civitas";

export const payrollRuns = pgTable("payroll_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  period: text("period").notNull(),
  cutoffDate: date("cutoff_date").notNull(),
  disburseTargetDate: date("disburse_target_date").notNull(),
  status: text("status", { enum: ["berjalan", "selesai"] }).default("berjalan").notNull(),
  eligibleEmployeeCount: integer("eligible_employee_count").default(0).notNull(),
  totalGross: bigint("total_gross", { mode: "number" }).default(0).notNull(),
  totalNet: bigint("total_net", { mode: "number" }).default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payrollRunSteps = pgTable("payroll_run_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  payrollRunId: uuid("payroll_run_id").references(() => payrollRuns.id, { onDelete: "cascade" }).notNull(),
  stepName: text("step_name", { enum: ["persiapan_data", "validasi_absensi_bkd", "kalkulasi", "persetujuan", "disburse_slip"] }).notNull(),
  status: text("status", { enum: ["pending", "berjalan", "selesai"] }).default("pending").notNull(),
  anomalyNote: text("anomaly_note"),
  processedBy: uuid("processed_by"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const payrollComponents = pgTable("payroll_components", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category", { enum: ["pendapatan", "potongan", "tunjangan", "sertifikasi", "skema_khusus"] }).notNull(),
  calculationType: text("calculation_type", { enum: ["tetap", "variabel"] }).notNull(),
  calculationRule: text("calculation_rule"),
  isTaxable: boolean("is_taxable").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const employeePayrollItems = pgTable("employee_payroll_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  payrollRunId: uuid("payroll_run_id").references(() => payrollRuns.id, { onDelete: "cascade" }).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  payrollComponentId: uuid("payroll_component_id").references(() => payrollComponents.id).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  reviewStatus: text("review_status", { enum: ["ok", "butuh_review"] }).default("ok").notNull(),
});

export const payslips = pgTable("payslips", {
  id: uuid("id").primaryKey().defaultRandom(),
  payrollRunId: uuid("payroll_run_id").references(() => payrollRuns.id, { onDelete: "cascade" }).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  status: text("status", { enum: ["draft", "published", "paid"] }).default("draft").notNull(),
  pdfUrl: text("pdf_url"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
});
