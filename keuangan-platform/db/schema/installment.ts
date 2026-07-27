import { pgTable, uuid, text, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { studentInvoices } from "./invoices";

export const installmentPlans = pgTable("installment_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").references(() => studentInvoices.id, { onDelete: "cascade" }).notNull(),
  scheme: text("scheme", { enum: ["cicilan_2x", "cicilan_3x", "penundaan_1bulan"] }).notNull(),
  termCount: numeric("term_count").notNull(),
  reason: text("reason").notNull(),
  documentUrl: text("document_url"),
  status: text("status", { enum: ["diajukan", "disetujui", "ditolak", "berjalan", "selesai", "gagal"] }).default("diajukan").notNull(),
  approvedByUserId: uuid("approved_by_user_id"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const installmentTerms = pgTable("installment_terms", {
  id: uuid("id").primaryKey().defaultRandom(),
  installmentPlanId: uuid("installment_plan_id").references(() => installmentPlans.id, { onDelete: "cascade" }).notNull(),
  termNumber: numeric("term_number").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status", { enum: ["belum_bayar", "lunas", "terlambat"] }).default("belum_bayar").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});
