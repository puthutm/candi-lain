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
  grossSalary: bigint("gross_salary", { mode: "number" }).default(0).notNull(),
  pph21Amount: bigint("pph21_amount", { mode: "number" }).default(0).notNull(),
  bpjsKesehatanAmount: bigint("bpjs_kesehatan_amount", { mode: "number" }).default(0).notNull(),
  bpjsKetenagakerjaanAmount: bigint("bpjs_ketenagakerjaan_amount", { mode: "number" }).default(0).notNull(),
  totalDeductions: bigint("total_deductions", { mode: "number" }).default(0).notNull(),
  netSalary: bigint("net_salary", { mode: "number" }).default(0).notNull(),
  status: text("status", { enum: ["draft", "published", "paid"] }).default("draft").notNull(),
  pdfUrl: text("pdf_url"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const taxBrackets = pgTable("tax_brackets", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category", { enum: ["TER_A", "TER_B", "TER_C", "PASAL_17"] }).notNull(),
  minGross: bigint("min_gross", { mode: "number" }).notNull(),
  maxGross: bigint("max_gross", { mode: "number" }).notNull(),
  ratePercent: bigint("rate_percent", { mode: "number" }).notNull(), // dalam basis point atau % (e.g. 5 = 5%)
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
});

export const payrollApprovals = pgTable("payroll_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  payrollRunId: uuid("payroll_run_id").references(() => payrollRuns.id, { onDelete: "cascade" }).notNull(),
  approverRole: text("approver_role", { enum: ["admin_payroll", "kabag_sdm", "warek_2"] }).notNull(),
  approverName: text("approver_name").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
