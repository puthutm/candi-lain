import { pgTable, uuid, text, timestamp, date, numeric } from "drizzle-orm/pg-core";
import { siakadStudents } from "./civitas";
import { pmbApplicants } from "./pmb";
import { siakadAcademicPeriods } from "./master";

export const siakadReregistrationInvoices = pgTable("siakad_reregistration_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => siakadStudents.id, { onDelete: "cascade" }), // nullable before NIM generation
  pmbApplicantRef: uuid("pmb_applicant_ref").references(() => pmbApplicants.id, { onDelete: "cascade" }).notNull(),
  invoiceNumber: text("invoice_number").unique().notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: ["unpaid", "paid", "expired"] }).default("unpaid").notNull(),
  dueDate: date("due_date").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

export const siakadSppInvoices = pgTable("siakad_spp_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => siakadStudents.id, { onDelete: "cascade" }).notNull(),
  academicPeriodId: uuid("academic_period_id").references(() => siakadAcademicPeriods.id, { onDelete: "cascade" }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: ["unpaid", "paid", "overdue"] }).default("unpaid").notNull(),
  dueDate: date("due_date").notNull(),
});

export const siakadSppPayments = pgTable("siakad_spp_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull(), // Refs either reregistration or spp invoice ID
  invoiceSource: text("invoice_source", { enum: ["reregistration", "spp"] }).notNull(),
  method: text("method", { enum: ["virtual_account", "qris", "e_wallet"] }).notNull(),
  providerRef: text("provider_ref").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),
});
