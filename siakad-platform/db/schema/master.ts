import { pgTable, uuid, text, integer, date, boolean, jsonb } from "drizzle-orm/pg-core";

export const siakadStudyPrograms = pgTable("siakad_study_programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  faculty: text("faculty").notNull(),
  degreeLevel: text("degree_level").default("S1").notNull(),
  kaprodiLecturerId: uuid("kaprodi_lecturer_id"), // Refers to lecturers.id
});

export const siakadCurricula = pgTable("siakad_curricula", {
  id: uuid("id").primaryKey().defaultRandom(),
  studyProgramId: uuid("study_program_id").references(() => siakadStudyPrograms.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  yearEffective: integer("year_effective").notNull(),
  totalSks: integer("total_sks").default(144).notNull(),
  totalSemester: integer("total_semester").default(8).notNull(),
  status: text("status", { enum: ["aktif", "legacy"] }).default("aktif").notNull(),
  cpl: jsonb("cpl"), // Capaian Pembelajaran Lulusan
});

export const siakadCourses = pgTable("siakad_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  sks: integer("sks").notNull(),
  type: text("type", { enum: ["wajib", "pilihan"] }).default("wajib").notNull(),
  learningMode: text("learning_mode", { enum: ["sync", "async", "hybrid"] }).default("async").notNull(),
  description: text("description"),
  coordinatorLecturerId: uuid("coordinator_lecturer_id"), // Refers to lecturers.id
});

export const siakadCurriculumCourses = pgTable("siakad_curriculum_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  curriculumId: uuid("curriculum_id").references(() => siakadCurricula.id, { onDelete: "cascade" }).notNull(),
  courseId: uuid("course_id").references(() => siakadCourses.id, { onDelete: "cascade" }).notNull(),
  semesterOffered: integer("semester_offered").notNull(),
  courseType: text("course_type", { enum: ["wajib_prodi", "pilihan", "mku", "mbkm", "skripsi"] }).default("wajib_prodi").notNull(),
});

export const siakadCoursePrerequisites = pgTable("siakad_course_prerequisites", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => siakadCourses.id, { onDelete: "cascade" }).notNull(),
  prerequisiteCourseId: uuid("prerequisite_course_id").references(() => siakadCourses.id, { onDelete: "cascade" }).notNull(),
  mustPass: boolean("must_pass").default(true).notNull(),
});

export const siakadAcademicPeriods = pgTable("siakad_academic_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // Ganjil 2026/2027
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status", { enum: ["draft", "berjalan", "terjadwal", "arsip"] }).default("draft").notNull(),
  stages: jsonb("stages"), // Tahapan cycles (KRS, UTS, UAS, masa sanggah nilai)
});
