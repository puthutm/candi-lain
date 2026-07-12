import { pgTable, uuid, timestamp, boolean, numeric, text } from "drizzle-orm/pg-core";
import { lmsClasses } from "./classes";

export const lmsGrades = pgTable("lms_grades", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references(() => lmsClasses.id, { onDelete: "cascade" }).notNull(),
  studentUserId: uuid("student_user_id").notNull(), // SSO User ID ref
  attendanceScore: numeric("attendance_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  assignmentScore: numeric("assignment_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  utsScore: numeric("uts_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  uasScore: numeric("uas_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  finalScore: numeric("final_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  letterGrade: text("letter_grade"),
  publishedToSiakad: boolean("published_to_siakad").default(false).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
