import { pgTable, uuid, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").unique().notNull(),
  accountFunction: text("account_function", {
    enum: ["operasional", "penerimaan_mahasiswa", "cadangan", "yayasan"],
  }).notNull(),
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  status: text("status", { enum: ["aktif", "reserve", "nonaktif"] }).default("aktif").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bankMutations = pgTable("bank_mutations", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankAccountId: uuid("bank_account_id").references(() => bankAccounts.id, { onDelete: "cascade" }).notNull(),
  direction: text("direction", { enum: ["debit", "kredit"] }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  balanceAfter: numeric("balance_after", { precision: 12, scale: 2 }).notNull(),
  reconciled: boolean("reconciled").default(false).notNull(),
  transactionDate: timestamp("transaction_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const internalTransfers = pgTable("internal_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromBankAccountId: uuid("from_bank_account_id").references(() => bankAccounts.id).notNull(),
  toBankAccountId: uuid("to_bank_account_id").references(() => bankAccounts.id).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  transferredAt: timestamp("transferred_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
