import { pgTable, uuid, text, integer, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { siakadStudents, siakadLecturers } from "./civitas";
import { siakadAcademicPeriods } from "./master";
import { siakadClasses, siakadClassSchedules } from "./classes";

export const siakadKrs = pgTable("siakad_krs", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => siakadStudents.id, { onDelete: "cascade" }).notNull(),
  academicPeriodId: uuid("academic_period_id").references(() => siakadAcademicPeriods.id, { onDelete: "cascade" }).notNull(),
  status: text("status", { enum: ["draft", "diajukan", "disetujui_pa", "ditolak"] }).default("draft").notNull(),
  totalSks: integer("total_sks").default(0).notNull(),
  maxSksAllowed: integer("max_sks_allowed").default(24).notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
});

export const siakadKrsItems = pgTable("siakad_krs_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  krsId: uuid("krs_id").references(() => siakadKrs.id, { onDelete: "cascade" }).notNull(),
  classId: uuid("class_id").references(() => siakadClasses.id, { onDelete: "cascade" }).notNull(),
  status: text("status", { enum: ["diajukan", "disetujui", "ditolak"] }).default("diajukan").notNull(),
});

export const siakadKrsApprovals = pgTable("siakad_krs_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  krsId: uuid("krs_id").references(() => siakadKrs.id, { onDelete: "cascade" }).notNull(),
  dosenPaId: uuid("dosen_pa_id").references(() => siakadLecturers.id, { onDelete: "cascade" }).notNull(),
  action: text("action", { enum: ["approve", "reject"] }).notNull(),
  note: text("note"), // mandatory if reject
  decidedAt: timestamp("decided_at", { withTimezone: true }).defaultNow().notNull(),
});

export const siakadGrades = pgTable("siakad_grades", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => siakadStudents.id, { onDelete: "cascade" }).notNull(),
  classId: uuid("class_id").references(() => siakadClasses.id, { onDelete: "cascade" }).notNull(),
  tugasScore: numeric("tugas_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  kuisScore: numeric("kuis_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  utsScore: numeric("uts_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  uasScore: numeric("uas_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  attendanceScore: numeric("attendance_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  finalScore: numeric("final_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  letterGrade: text("letter_grade"), // A, B, C, D, E
  gradePoint: numeric("grade_point", { precision: 3, scale: 2 }).default("0.00").notNull(), // 4.00, 3.00 etc
  locked: boolean("locked").default(false).notNull(),
  gradedByLecturerId: uuid("graded_by_lecturer_id").references(() => siakadLecturers.id),
});

export const siakadAttendances = pgTable("siakad_attendances", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => siakadStudents.id, { onDelete: "cascade" }).notNull(),
  classScheduleId: uuid("class_schedule_id").references(() => siakadClassSchedules.id, { onDelete: "cascade" }).notNull(),
  status: text("status", { enum: ["hadir", "izin", "alpa"] }).notNull(),
  source: text("source", { enum: ["lms_sync", "manual"] }).default("manual").notNull(),
});
