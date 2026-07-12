import { pgTable, uuid, text, numeric, boolean, timestamp, date } from "drizzle-orm/pg-core";

export const studentInvoices = pgTable("student_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentUserId: uuid("student_user_id").notNull(),
  invoiceNumber: text("invoice_number").unique().notNull(),
  invoiceType: text("invoice_type", { enum: ["ukt", "pmb", "wisuda", "lainnya"] }).notNull(),
  academicPeriodLabel: text("academic_period_label").notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  outstandingAmount: numeric("outstanding_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: ["outstanding", "lunas", "cicilan", "beasiswa", "overdue"] }).default("outstanding").notNull(),
  dueDate: date("due_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studentInvoiceItems = pgTable("student_invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").references(() => studentInvoices.id, { onDelete: "cascade" }).notNull(),
  componentName: text("component_name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  scholarshipRecipientId: uuid("scholarship_recipient_id"),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").references(() => studentInvoices.id, { onDelete: "cascade" }).notNull(),
  channel: text("channel", { enum: ["virtual_account", "qris", "kartu_kredit", "manual_dipa", "setor_tunai"] }).notNull(),
  providerRef: text("provider_ref").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "success", "failed"] }).default("pending").notNull(),
  autoReconciled: boolean("auto_reconciled").default(false).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  journalEntryId: uuid("journal_entry_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
