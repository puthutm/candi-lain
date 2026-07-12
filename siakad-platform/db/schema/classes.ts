import { pgTable, uuid, text, integer, timestamp, date, boolean, numeric } from "drizzle-orm/pg-core";
import { siakadCourses, siakadAcademicPeriods, siakadStudyPrograms } from "./master";

export const siakadClasses = pgTable("siakad_classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => siakadCourses.id, { onDelete: "cascade" }).notNull(),
  academicPeriodId: uuid("academic_period_id").references(() => siakadAcademicPeriods.id, { onDelete: "cascade" }).notNull(),
  studyProgramId: uuid("study_program_id").references(() => siakadStudyPrograms.id, { onDelete: "cascade" }).notNull(),
  dosenUtamaId: uuid("dosen_utama_id"), // Refers to lecturers.id
  className: text("class_name").notNull(), // Kelas A / Kelas B PJJ
  capacity: integer("capacity").notNull(),
  enrolledCount: integer("enrolled_count").default(0).notNull(),
  waitlistCount: integer("waitlist_count").default(0).notNull(),
  waitlistThresholdOpenParallel: integer("waitlist_threshold_open_parallel").default(10).notNull(),
  mode: text("mode", { enum: ["sync", "async"] }).default("async").notNull(),
  status: text("status", { enum: ["draft", "aktif", "selesai"] }).default("draft").notNull(),
  gradeLocked: boolean("grade_locked").default(false).notNull(),
});

export const siakadClassCoTeachers = pgTable("siakad_class_co_teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references(() => siakadClasses.id, { onDelete: "cascade" }).notNull(),
  lecturerId: uuid("lecturer_id").notNull(), // Refers to lecturers.id
  roleNote: text("role_note"),
});

export const siakadClassSchedules = pgTable("siakad_class_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references(() => siakadClasses.id, { onDelete: "cascade" }).notNull(),
  sessionNumber: integer("session_number").notNull(),
  topic: text("topic").notNull(),
  sessionDate: date("session_date").notNull(),
  startTime: text("start_time").notNull(), // time as HH:MM string
  endTime: text("end_time").notNull(),
  sessionType: text("session_type", { enum: ["reguler", "libur", "uts", "uas"] }).default("reguler").notNull(),
  vcLink: text("vc_link"), // zoom conference link
});

export const siakadGradeComponents = pgTable("siakad_grade_components", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references(() => siakadClasses.id, { onDelete: "cascade" }), // null if global defaults
  componentName: text("component_name").notNull(), // Tugas, Kuis, UTS, UAS, Kehadiran
  weightPercent: numeric("weight_percent", { precision: 5, scale: 2 }).notNull(),
  isOverride: boolean("is_override").default(false).notNull(),
});

export const siakadLearningMaterials = pgTable("siakad_learning_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references(() => siakadClasses.id, { onDelete: "cascade" }).notNull(),
  classScheduleId: uuid("class_schedule_id").references(() => siakadClassSchedules.id, { onDelete: "cascade" }).notNull(),
  materialType: text("material_type", { enum: ["file", "video", "tugas"] }).notNull(),
  title: text("title").notNull(),
  fileUrl: text("file_url").notNull(),
  status: text("status", { enum: ["belum_diisi", "terunggah"] }).default("belum_diisi").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
});
