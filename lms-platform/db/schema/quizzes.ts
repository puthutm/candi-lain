import { pgTable, uuid, text, integer, timestamp, pgEnum, jsonb, numeric } from "drizzle-orm/pg-core";
import { lmsSessions, lmsQuestionTypeEnum } from "./sessions";

export const lmsQuizAttemptStatusEnum = pgEnum("lms_quiz_attempt_status", ["belum_mulai", "sedang_mengerjakan", "selesai"]);

export const lmsQuizzes = pgTable("lms_quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => lmsSessions.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  questionCount: integer("question_count").default(0).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  weightPercent: numeric("weight_percent", { precision: 5, scale: 2 }).notNull(),
  openAt: timestamp("open_at", { withTimezone: true }),
  closeAt: timestamp("close_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lmsQuizQuestions = pgTable("lms_quiz_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").references(() => lmsQuizzes.id, { onDelete: "cascade" }).notNull(),
  questionText: text("question_text").notNull(),
  questionType: lmsQuestionTypeEnum("question_type").default("pilihan_ganda").notNull(),
  options: jsonb("options"), // array of choices for multiple choice quiz questions
  correctAnswer: text("correct_answer"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lmsQuizAttempts = pgTable("lms_quiz_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").references(() => lmsQuizzes.id, { onDelete: "cascade" }).notNull(),
  studentUserId: uuid("student_user_id").notNull(),
  status: lmsQuizAttemptStatusEnum("status").default("belum_mulai").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  score: numeric("score", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
