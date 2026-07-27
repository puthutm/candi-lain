import { pgTable, uuid, text, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { chartOfAccounts } from "./master";

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  journalNumber: text("journal_number").unique().notNull(),
  entryDate: date("entry_date").notNull(),
  description: text("description").notNull(),
  source: text("source", { enum: ["auto_penerimaan", "auto_payroll", "auto_po", "manual"] }).notNull(),
  status: text("status", { enum: ["draft", "posted"] }).default("draft").notNull(),
  createdByUserId: uuid("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const journalEntryLines = pgTable("journal_entry_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  journalEntryId: uuid("journal_entry_id").references(() => journalEntries.id, { onDelete: "cascade" }).notNull(),
  accountId: uuid("account_id").references(() => chartOfAccounts.id).notNull(),
  debit: numeric("debit", { precision: 12, scale: 2 }).default("0.00").notNull(),
  credit: numeric("credit", { precision: 12, scale: 2 }).default("0.00").notNull(),
  description: text("description"),
});

export const budgetAllocations = pgTable("budget_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitClusterName: text("unit_cluster_name").notNull(),
  fiscalYear: text("fiscal_year").notNull(),
  approvedBudget: numeric("approved_budget", { precision: 12, scale: 2 }).notNull(),
  realizedAmount: numeric("realized_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  yayasanApprovedAt: timestamp("yayasan_approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
