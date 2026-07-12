import { pgTable, uuid, text, timestamp, date, numeric, jsonb } from "drizzle-orm/pg-core";
import { pmbApplicants } from "./applicants";

export const pmbInvoices = pgTable("pmb_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantId: uuid("applicant_id").references(() => pmbApplicants.id, { onDelete: "cascade" }).notNull(),
  invoiceNumber: text("invoice_number").unique().notNull(),
  invoiceType: text("invoice_type", { enum: ["formulir", "daftar_ulang"] }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: ["unpaid", "paid", "expired"] }).default("unpaid").notNull(),
  dueDate: date("due_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pmbPaymentTransactions = pgTable("pmb_payment_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").references(() => pmbInvoices.id, { onDelete: "cascade" }).notNull(),
  method: text("method", { enum: ["virtual_account", "qris", "e_wallet", "transfer_bank"] }).notNull(),
  providerRef: text("provider_ref").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "success", "failed"] }).default("pending").notNull(),
  webhookPayload: jsonb("webhook_payload"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
