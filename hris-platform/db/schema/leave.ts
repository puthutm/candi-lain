import { pgTable, uuid, text, timestamp, integer, date, time, decimal } from "drizzle-orm/pg-core";
import { employees } from "./civitas";

export const attendances = pgTable("attendances", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  attendanceDate: date("attendance_date").notNull(),
  status: text("status", { enum: ["hadir", "terlambat", "wfh", "cuti", "alpha"] }).notNull(),
  checkIn: time("check_in"),
  checkOut: time("check_out"),
  workHours: decimal("work_hours", { precision: 4, scale: 2 }).default("0.00").notNull(),
});

export const leaveTypes = pgTable("leave_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  defaultQuotaDays: integer("default_quota_days").notNull(),
});

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  leaveTypeId: uuid("leave_type_id").references(() => leaveTypes.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["menunggu", "disetujui", "ditolak"] }).default("menunggu").notNull(),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
});

export const leaveBalances = pgTable("leave_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  leaveTypeId: uuid("leave_type_id").references(() => leaveTypes.id).notNull(),
  year: integer("year").notNull(),
  quotaDays: integer("quota_days").notNull(),
  usedDays: integer("used_days").default(0).notNull(),
});
