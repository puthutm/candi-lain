import { pgTable, uuid, text, timestamp, integer, date, decimal } from "drizzle-orm/pg-core";
import { employees } from "./civitas";
import { organizationUnits, positions } from "./organization";

export const mutationLetters = pgTable("mutation_letters", {
  id: uuid("id").primaryKey().defaultRandom(),
  letterNumber: text("letter_number").unique().notNull(),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  type: text("type", { enum: ["mutasi_unit", "promosi_fungsional", "promosi_struktural"] }).notNull(),
  fromOrganizationUnitId: uuid("from_organization_unit_id").references(() => organizationUnits.id).notNull(),
  toOrganizationUnitId: uuid("to_organization_unit_id").references(() => organizationUnits.id).notNull(),
  targetPositionId: uuid("target_position_id").references(() => positions.id).notNull(),
  requiredCreditPoint: integer("required_credit_point").default(0).notNull(),
  actualCreditPoint: integer("actual_credit_point").default(0).notNull(),
  effectiveDate: date("effective_date").notNull(),
  status: text("status", { enum: ["pending_approval", "disetujui", "ditolak"] }).default("pending_approval").notNull(),
  approvedBy: uuid("approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const creditPointRecords = pgTable("credit_point_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  source: text("source", { enum: ["pendidikan", "penelitian", "pengabdian", "penunjang"] }).notNull(),
  points: decimal("points", { precision: 5, scale: 2 }).notNull(),
  description: text("description").notNull(),
  recordedDate: date("recorded_date").notNull(),
});
