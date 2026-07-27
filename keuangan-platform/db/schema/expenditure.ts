import { pgTable, uuid, text, numeric, timestamp, boolean } from "drizzle-orm/pg-core";

/**
 * Fase 3 — Pengeluaran
 */

/**
 * FR-7: Purchase Order & Belanja
 */
export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  poNumber: text("po_number").notNull().unique(),
  vendorName: text("vendor_name").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  description: text("description"),
  status: text("status", { enum: ["draf", "menunggu_approval", "approved", "rejected", "paid", "cancelled"] }).default("draf").notNull(),
  currentStage: text("current_stage", { enum: ["kepala_biro", "wr2", "rektor", "yayasan"] }),
  requiresQuotation: boolean("requires_quotation").default(false).notNull(),
  quotationCount: numeric("quotation_count", { precision: 2, scale: 0 }).default("0"),
  createdBy: text("created_by"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectedReason: text("rejected_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const poApprovals = pgTable("po_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id, { onDelete: "cascade" }).notNull(),
  stage: text("stage", { enum: ["kepala_biro", "wr2", "rektor", "yayasan"] }).notNull(),
  approverRole: text("approver_role").notNull(),
  approverName: text("approver_name"),
  action: text("action", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  notes: text("notes"),
  actedAt: timestamp("acted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const paymentsOut = pgTable("payments_out", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id, { onDelete: "set null" }),
  sourceBankAccountId: uuid("source_bank_account_id").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  method: text("method", { enum: ["transfer", "cash", "cheque"] }).notNull(),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * FR-8: Honorarium Eksternal & Komisi CRM
 */
export const externalHonorariums = pgTable("external_honorariums", {
  id: uuid("id").primaryKey().defaultRandom(),
  payeeName: text("payee_name").notNull(),
  payeeNpwp: text("payee_npwp"),
  payeeBankAccount: text("payee_bank_account"),
  category: text("category", { enum: ["honorarium_dosen", "honorarium_tendik", "honorarium_pembicara", "jasa_teknis", "sewa", "lainnya"] }).notNull(),
  activityDescription: text("activity_description").notNull(),
  grossAmount: numeric("gross_amount", { precision: 14, scale: 2 }).notNull(),
  taxType: text("tax_type", { enum: ["pph21", "pph23", "pph42", "none"] }).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 14, scale: 2 }).notNull(),
  netAmount: numeric("net_amount", { precision: 14, scale: 2 }).notNull(),
  status: text("status", { enum: ["draf", "disetujui", "dibayar", "ditolak"] }).default("draf").notNull(),
  approvedBy: text("approved_by"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const referralDisbursements = pgTable("referral_disbursements", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentName: text("agent_name").notNull(),
  agentIdSnapshot: text("agent_id_snapshot").notNull(),
  period: text("period").notNull(),
  totalReferrals: numeric("total_referrals", { precision: 6, scale: 0 }).notNull(),
  ratePerReferral: numeric("rate_per_referral", { precision: 12, scale: 2 }).notNull(),
  grossAmount: numeric("gross_amount", { precision: 14, scale: 2 }).notNull(),
  taxType: text("tax_type", { enum: ["pph21", "pph23", "pph42", "none"] }).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 14, scale: 2 }).notNull(),
  netAmount: numeric("net_amount", { precision: 14, scale: 2 }).notNull(),
  status: text("status", { enum: ["draf", "disetujui", "dibayar", "ditolak"] }).default("draf").notNull(),
  approvedBy: text("approved_by"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * FR-9: Payroll Disbursement
 */
export const payrollDisbursements = pgTable("payroll_disbursements", {
  id: uuid("id").primaryKey().defaultRandom(),
  period: text("period").notNull(),
  source: text("source", { enum: ["hris", "manual"] }).default("hris").notNull(),
  totalGross: numeric("total_gross", { precision: 14, scale: 2 }).notNull(),
  totalTax: numeric("total_tax", { precision: 14, scale: 2 }).notNull(),
  totalNet: numeric("total_net", { precision: 14, scale: 2 }).notNull(),
  status: text("status", { enum: ["draf", "disetujui", "disbursed", "rejected"] }).default("draf").notNull(),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectedReason: text("rejected_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payrollDisbursementItems = pgTable("payroll_disbursement_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  payrollDisbursementId: uuid("payroll_disbursement_id").references(() => payrollDisbursements.id, { onDelete: "cascade" }).notNull(),
  employeeName: text("employee_name").notNull(),
  employeeRole: text("employee_role").notNull(),
  grossAmount: numeric("gross_amount", { precision: 14, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 14, scale: 2 }).notNull(),
  netAmount: numeric("net_amount", { precision: 14, scale: 2 }).notNull(),
  bankAccount: text("bank_account"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
