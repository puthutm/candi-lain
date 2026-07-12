import { pgTable, uuid, text, timestamp, bigint, integer } from "drizzle-orm/pg-core";
import { organizationUnits, positions } from "./organization";

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeNumber: text("employee_number").unique().notNull(),
  fullName: text("full_name").notNull(),
  employeeType: text("employee_type", { enum: ["dosen", "tendik"] }).notNull(),
  organizationUnitId: uuid("organization_unit_id").references(() => organizationUnits.id).notNull(),
  positionId: uuid("position_id").references(() => positions.id).notNull(),
  rankGroup: text("rank_group").notNull(),
  baseSalary: bigint("base_salary", { mode: "number" }).notNull(),
  status: text("status", { enum: ["aktif", "non_aktif", "pensiun", "cuti_panjang"] }).default("aktif").notNull(),
  bankAccountNumber: text("bank_account_number").notNull(),
  bankName: text("bank_name").notNull(),
  ssoUserId: uuid("sso_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const employeeOnboarding = pgTable("employee_onboarding", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  completenessPercent: integer("completeness_percent").default(0).notNull(),
  status: text("status", { enum: ["draf", "proses", "selesai"] }).default("draf").notNull(),
  checklistJson: text("checklist_json").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const employmentStatusHistory = pgTable("employment_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  fromStatus: text("from_status").notNull(),
  toStatus: text("to_status").notNull(),
  note: text("note"),
  changedBy: uuid("changed_by").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
});
