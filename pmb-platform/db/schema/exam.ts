import { pgTable, uuid, text, boolean, integer, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { pmbApplicants } from "./applicants";

export const pmbExamModules = pgTable("pmb_exam_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // TPA, Pengetahuan Umum, PKN, Bahasa Inggris, Buta Warna
  code: text("code").unique().notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  type: text("type", { enum: ["teks", "gambar"] }).notNull(),
  questionCount: integer("question_count").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const pmbExamQuestions = pgTable("pmb_exam_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  examModuleId: uuid("exam_module_id").references(() => pmbExamModules.id, { onDelete: "cascade" }).notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type", { enum: ["pilihan_ganda", "gambar"] }).default("pilihan_ganda").notNull(),
  options: jsonb("options").notNull(), // JSON list of choices: e.g. ["A", "B", "C", "D"]
  correctAnswer: text("correct_answer").notNull(),
  imageUrl: text("image_url"),
});

export const pmbExamSessions = pgTable("pmb_exam_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantId: uuid("applicant_id").references(() => pmbApplicants.id, { onDelete: "cascade" }).notNull(),
  examModuleId: uuid("exam_module_id").references(() => pmbExamModules.id, { onDelete: "cascade" }).notNull(),
  status: text("status", { enum: ["belum_dikerjakan", "draf", "selesai_dikumpulkan"] }).default("belum_dikerjakan").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  timeRemainingSeconds: integer("time_remaining_seconds").notNull(),
});

export const pmbExamAnswers = pgTable("pmb_exam_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  examSessionId: uuid("exam_session_id").references(() => pmbExamSessions.id, { onDelete: "cascade" }).notNull(),
  examQuestionId: uuid("exam_question_id").references(() => pmbExamQuestions.id, { onDelete: "cascade" }).notNull(),
  answerValue: text("answer_value").notNull(),
  answeredAt: timestamp("answered_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pmbExamResults = pgTable("pmb_exam_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantId: uuid("applicant_id").references(() => pmbApplicants.id, { onDelete: "cascade" }).notNull(),
  examModuleId: uuid("exam_module_id").references(() => pmbExamModules.id, { onDelete: "cascade" }).notNull(),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  passed: boolean("passed").default(false).notNull(),
  gradedByStaffId: uuid("graded_by_staff_id"), // Refers to SSO Core users.id
  gradedAt: timestamp("graded_at", { withTimezone: true }),
});
